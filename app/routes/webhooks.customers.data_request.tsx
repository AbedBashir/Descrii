import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // This app never stores customer personal data (no names, emails, orders,
  // or any customer-identifiable information) — only shop-level settings
  // (brand voice, language, plan) and anonymous usage counts. There is
  // nothing to return for this request.
  console.log("customers/data_request payload:", JSON.stringify(payload));

  return new Response();
};
