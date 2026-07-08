import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { languageName } from "../models/languages";
import { checkLimit, logUsage } from "../models/usage.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const productName = formData.get("productName") as string;

  try {
    const settings = await getSettings(session.shop);
    // Multi-language is a Pro-only feature — force English for everyone else,
    // even if a stale language value is stored from a previous Pro subscription.
    const language = settings.plan === "pro" ? languageName(settings.defaultLanguage) : "English";

    const limitCheck = await checkLimit(session.shop, settings.plan, "product");
    if (!limitCheck.allowed) {
      return Response.json({
        error: `You've reached your monthly limit (${limitCheck.used}/${limitCheck.limit === Infinity ? "∞" : limitCheck.limit} products). Upgrade your plan to continue.`,
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
Product: ${productName}
Product type: ${formData.get("productType") || "general"}
Variants/specs: ${formData.get("specs") || "not specified"}
Extra info: ${formData.get("extraInfo") || "none"}
Return: {"title":"SEO-optimized title under 70 chars","description":"150-200 word compelling description as plain text","bullets":["benefit 1","benefit 2","benefit 3","benefit 4","benefit 5"],"metaTitle":"meta title under 60 chars","metaDescription":"meta description under 160 chars"}`,
        }],
      }),
    });

    if (!aiResponse.ok) {
      return Response.json({ error: `AI generation failed: ${aiResponse.status}` });
    }

    const aiData = await aiResponse.json();
    const text = aiData.content[0].text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(text);

    const bulletHtml = generated.bullets.map((b: string) => `<li>${b}</li>`).join("");
    const fullDescription = `<p>${generated.description}</p><ul>${bulletHtml}</ul>`;

    const input: any = {
      id: productId,
      descriptionHtml: fullDescription,
      seo: { title: generated.metaTitle, description: generated.metaDescription },
    };
    const isPaid = settings.plan === "starter" || settings.plan === "pro";
    const shouldUpdateTitle = isPaid ? settings.autoUpdateProductTitle : true;
    if (shouldUpdateTitle) {
      input.title = generated.title;
    }

    const shopifyResponse = await admin.graphql(
      `#graphql
      mutation updateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id title }
          userErrors { field message }
        }
      }`,
      { variables: { input } }
    );

    const shopifyJson = await shopifyResponse.json();
    const userErrors = shopifyJson.data?.productUpdate?.userErrors;
    if (userErrors?.length > 0) {
      return Response.json({ error: userErrors[0].message });
    }

    const finalName = shouldUpdateTitle ? generated.title : productName;
    await logUsage(session.shop, "product", finalName);

    return Response.json({
      pushed: true,
      productId,
      productName: finalName,
      shopDomain: session.shop.replace(".myshopify.com", ""),
    });
  } catch (e: any) {
    console.error("API generate-product error:", e);
    return Response.json({ error: e.message || "Failed to generate or push." });
  }
};
