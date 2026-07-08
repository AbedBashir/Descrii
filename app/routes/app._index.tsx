import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { getUsageThisMonth, getRecentActivity } from "../models/usage.server";
import { getLimits, PLAN_NAMES, type PlanId } from "../models/plans";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  const plan = (settings.plan as PlanId) || "free";
  const limits = getLimits(plan);

  const [productsUsed, collectionsUsed, activity] = await Promise.all([
    getUsageThisMonth(session.shop, "product"),
    getUsageThisMonth(session.shop, "collection"),
    getRecentActivity(session.shop, 5),
  ]);

  return {
    plan,
    planName: PLAN_NAMES[plan] || "Free",
    limits,
    productsUsed,
    collectionsUsed,
    activity,
  };
};

function UsageCircle({
  used,
  total,
  label,
  color = "#008060",
}: {
  used: number;
  total: number;
  label: string;
  color?: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const isUnlimited = total === Infinity;
  const progress = isUnlimited ? 0 : total === 0 ? 0 : Math.min(used / total, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const percentage = isUnlimited ? 0 : total === 0 ? 0 : Math.round((used / total) * 100);

  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px",
      padding: "24px", display: "flex", flexDirection: "column", alignItems: "center",
      gap: "12px", flex: "1", minWidth: "160px",
    }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--surface-subdued)" strokeWidth="12" />
        {!isUnlimited && (
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={progress > 0.8 ? "#d72c0d" : progress > 0.6 ? "#f49342" : color}
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 65 65)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        )}
        {isUnlimited && (
          <circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        )}
        <text x="65" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-primary)">
          {used}
        </text>
        <text x="65" y="76" textAnchor="middle" fontSize="13" fill="var(--text-secondary)">
          of {isUnlimited ? "∞" : total}
        </text>
      </svg>
      <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
        {isUnlimited ? "Unlimited" : `${percentage}% used`}
      </p>
    </div>
  );
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Home() {
  const { plan, planName, limits, productsUsed, collectionsUsed, activity } = useLoaderData<typeof loader>();
  const isNewUser = productsUsed === 0 && collectionsUsed === 0 && activity.length === 0;

  return (
    <s-page heading="AI Descriptions Generator">

      {isNewUser && (
        <s-section heading="Get started">
          <div style={{
            background: "var(--card-bg)", border: "1px solid var(--card-border)",
            borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%", background: "var(--surface-subdued)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
                fontWeight: "700", color: "var(--text-primary)", flexShrink: 0,
              }}>1</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Set your brand voice</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                  <a href="/app/settings" style={{ color: "#008060" }}>Go to Settings →</a>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%", background: "var(--surface-subdued)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
                fontWeight: "700", color: "var(--text-primary)", flexShrink: 0,
              }}>2</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Generate your first product description</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                  <a href="/app/products" style={{ color: "#008060" }}>Go to Products →</a>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%", background: "var(--surface-subdued)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
                fontWeight: "700", color: "var(--text-primary)", flexShrink: 0,
              }}>3</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Try bulk generation to save time</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Select multiple products at once from either page</p>
              </div>
            </div>
          </div>
        </s-section>
      )}

      <s-section heading="Usage this month">
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <UsageCircle used={productsUsed} total={limits.products} label="Products" />
          <UsageCircle used={collectionsUsed} total={limits.collections} label="Collections" color="#5c6ac4" />
        </div>
      </s-section>

      {activity.length > 0 && (
        <s-section heading="Recent activity">
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden" }}>
            {activity.map((item: any, i: number) => (
              <div key={item.id} style={{
                padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: i < activity.length - 1 ? "1px solid var(--card-border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{item.type === "product" ? "📝" : "📦"}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    {item.itemName || (item.type === "product" ? "Product" : "Collection")}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{timeAgo(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </s-section>
      )}

      <s-section heading="Your plan" slot="aside">
        <div style={{ background: "var(--surface-subdued)", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--text-secondary)" }}>Current plan</p>
          <p style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{planName}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)" }}>
              📝 {productsUsed}/{limits.products === Infinity ? "∞" : limits.products} products
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)" }}>
              📦 {collectionsUsed}/{limits.collections === Infinity ? "∞" : limits.collections} collections
            </p>
          </div>
        </div>
        {plan !== "pro" && <s-button href="/app/plan" variant="primary">Upgrade plan</s-button>}
      </s-section>

      <s-section heading="Tips" slot="aside">
        <s-unordered-list>
          <s-list-item>Select a product from your store to auto-fill details.</s-list-item>
          <s-list-item>Bulk generate to save time on large catalogs.</s-list-item>
          <s-list-item>Set your brand voice in Settings for consistent tone.</s-list-item>
          <s-list-item>Always review AI copy before publishing.</s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="Support" slot="aside">
        <s-paragraph>Need help? We're here for you.</s-paragraph>
        <s-button href="mailto:support@fusions.agency">Get support</s-button>
      </s-section>

    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
