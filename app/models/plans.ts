export type PlanId = "free" | "starter" | "pro";

export const PLAN_LIMITS: Record<PlanId, { products: number; collections: number; bulk: boolean }> = {
  free: { products: 10, collections: 10, bulk: true },
  starter: { products: 100, collections: 100, bulk: true },
  pro: { products: Infinity, collections: Infinity, bulk: true },
};

export const PLAN_NAMES: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export function getLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanId) in PLAN_LIMITS ? (plan as PlanId) : "free"];
}
