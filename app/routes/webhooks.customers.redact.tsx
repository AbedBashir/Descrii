import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // This app never stores customer personal data, so there is nothing
  // to redact for this customer.
  console.log("customers/redact payload:", JSON.stringify(payload));

  return new Response();
};
