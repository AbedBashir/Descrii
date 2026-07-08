import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { languageName } from "../models/languages";
import { checkLimit, logUsage } from "../models/usage.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const collectionId = formData.get("collectionId") as string;
  const collectionName = formData.get("collectionName") as string;

  try {
    const settings = await getSettings(session.shop);
    // Multi-language is a Pro-only feature — force English for everyone else,
    // even if a stale language value is stored from a previous Pro subscription.
    const language = settings.plan === "pro" ? languageName(settings.defaultLanguage) : "English";

    const limitCheck = await checkLimit(session.shop, settings.plan, "collection");
    if (!limitCheck.allowed) {
      return Response.json({
        error: `You've reached your monthly limit (${limitCheck.used}/${limitCheck.limit === Infinity ? "∞" : limitCheck.limit} collections). Upgrade your plan to continue.`,
        limitReached: true,
      });
    }

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are an expert Shopify copywriter. Write everything in ${language}.${settings.brandVoice ? ` Match this brand voice: ${settings.brandVoice}` : ""} Return ONLY a valid JSON object, no extra text, no markdown.
Collection: ${collectionName}
Extra info: ${formData.get("extraInfo") || "none"}
Return: {"title":"Collection title under 60 chars","shortDescription":"1-2 sentence hook under 100 chars","fullDescription":"150-200 word description as plain text","metaTitle":"meta title under 60 chars","metaDescription":"meta description under 160 chars"}`,
        }],
      }),
    });

    if (!aiResponse.ok) {
      return Response.json({ error: `AI generation failed: ${aiResponse.status}` });
    }

    const aiData = await aiResponse.json();
    const text = aiData.content[0].text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(text);

    const fullDescriptionHtml = `<p><strong>${generated.shortDescription}</strong></p><p>${generated.fullDescription}</p>`;

    const input: any = {
      id: collectionId,
      descriptionHtml: fullDescriptionHtml,
      seo: { title: generated.metaTitle, description: generated.metaDescription },
    };
    const isPaid = settings.plan === "starter" || settings.plan === "pro";
    const shouldUpdateTitle = isPaid ? settings.autoUpdateCollectionTitle : true;
    if (shouldUpdateTitle) {
      input.title = generated.title;
    }

    const shopifyResponse = await admin.graphql(
      `#graphql
      mutation updateCollection($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id title }
          userErrors { field message }
        }
      }`,
      { variables: { input } }
    );

    const shopifyJson = await shopifyResponse.json();
    const userErrors = shopifyJson.data?.collectionUpdate?.userErrors;
    if (userErrors?.length > 0) {
      return Response.json({ error: userErrors[0].message });
    }

    const finalName = shouldUpdateTitle ? generated.title : collectionName;
    await logUsage(session.shop, "collection", finalName);

    return Response.json({
      pushed: true,
      collectionId,
      collectionName: finalName,
      shopDomain: session.shop.replace(".myshopify.com", ""),
    });
  } catch (e: any) {
    console.error("API generate-collection error:", e);
    return Response.json({ error: e.message || "Failed to generate or push." });
  }
};
