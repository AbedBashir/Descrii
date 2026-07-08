import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // Shopify sends this 48 hours after an app is uninstalled and requires
  // all shop data to be permanently deleted. Remove everything tied to
  // this shop across our tables.
  await db.usageLog.deleteMany({ where: { shop } });
  await db.appSettings.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });

  console.log(`Deleted all data for ${shop} per shop/redact request`);

  return new Response();
};
