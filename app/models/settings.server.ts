import db from "../db.server";

export async function getSettings(shop: string) {
  let settings = await db.appSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await db.appSettings.create({ data: { shop } });
  }
  return settings;
}

export async function updateSettings(
  shop: string,
  data: Partial<{
    autoUpdateProductTitle: boolean;
    autoUpdateCollectionTitle: boolean;
    defaultLanguage: string;
    brandVoice: string;
    plan: string;
    autoGenerateOnNewProducts: boolean;
  }>
) {
  return db.appSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
}
