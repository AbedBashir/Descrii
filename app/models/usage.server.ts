import db from "../db.server";
import { getLimits } from "./plans";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getUsageThisMonth(shop: string, type: "product" | "collection") {
  return db.usageLog.count({
    where: { shop, type, createdAt: { gte: startOfMonth() } },
  });
}

export async function logUsage(shop: string, type: "product" | "collection", itemName?: string) {
  return db.usageLog.create({ data: { shop, type, itemName } });
}

export async function checkLimit(shop: string, plan: string, type: "product" | "collection") {
  const limits = getLimits(plan);
  const limit = type === "product" ? limits.products : limits.collections;
  const used = await getUsageThisMonth(shop, type);
  return {
    allowed: used < limit,
    used,
    limit,
  };
}

export async function getRecentActivity(shop: string, limit: number = 5) {
  return db.usageLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
