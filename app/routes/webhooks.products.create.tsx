import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { languageName } from "../models/languages";
import { logUsage } from "../models/usage.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  if (!admin) return new Response();

  const settings = await getSettings(shop);
  // Auto-generate on new products is a Pro-only feature, and must be
  // explicitly enabled by the merchant in Settings.
  if (settings.plan !== "pro") return new Response();
  if (!settings.autoGenerateOnNewProducts) return new Response();

  const product = payload as any;
  const productId = product.admin_graphql_api_id;
  const productName = product.title;
  const productType = product.product_type || "general";

  try {
    const language = languageName(settings.defaultLanguage);

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
Product type: ${productType}
Return: {"title":"SEO-optimized title under 70 chars","description":"150-200 word compelling description as plain text","bullets":["benefit 1","benefit 2","benefit 3","benefit 4","benefit 5"],"metaTitle":"meta title under 60 chars","metaDescription":"meta description under 160 chars"}`,
        }],
      }),
    });

    if (!aiResponse.ok) return new Response();

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
    if (settings.autoUpdateProductTitle) {
      input.title = generated.title;
    }

    await admin.graphql(
      `#graphql
      mutation updateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { field message }
        }
      }`,
      { variables: { input } }
    );

    await logUsage(shop, "product");
  } catch (e) {
    console.error("Auto-generate on new product failed:", e);
  }

  return new Response();
};
