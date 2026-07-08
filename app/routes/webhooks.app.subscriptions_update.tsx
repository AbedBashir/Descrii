import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { updateSettings } from "../models/settings.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const subscription = (payload as any)?.app_subscription;

  if (subscription) {
    const status = subscription.status;
    const name = subscription.name;

    if (status === "ACTIVE") {
      const plan = name === "Pro" ? "pro" : name === "Starter" ? "starter" : "free";
      await updateSettings(shop, { plan });
    } else {
      // CANCELLED, EXPIRED, FROZEN, DECLINED — fall back to Free
      await updateSettings(shop, { plan: "free" });
    }
  }

  return new Response();
};
