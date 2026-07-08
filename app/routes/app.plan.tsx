import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { updateSettings } from "../models/settings.server";

const isTest = process.env.NODE_ENV !== "production";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);

  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: ["Starter", "Pro"],
    isTest,
  });

  let currentPlan: "free" | "starter" | "pro" = "free";
  if (hasActivePayment && appSubscriptions.length > 0) {
    const name = appSubscriptions[0].name;
    currentPlan = name === "Pro" ? "pro" : name === "Starter" ? "starter" : "free";
  }

  // Keep our DB in sync with Shopify's real billing state
  await updateSettings(session.shop, { plan: currentPlan });

  return { currentPlan };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "cancel") {
    const { appSubscriptions } = await billing.check({ plans: ["Starter", "Pro"], isTest });
    if (appSubscriptions.length > 0) {
      await billing.cancel({
        subscriptionId: appSubscriptions[0].id,
        isTest,
        prorate: true,
      });
    }
    await updateSettings(session.shop, { plan: "free" });
    return redirect("/app/plan");
  }

  const plan = formData.get("plan") as string;
  return billing.request({
    plan,
    isTest,
    returnUrl: `${process.env.SHOPIFY_APP_URL}/app/plan`,
  });
};

const ANNUAL_DISCOUNT = 0.15;

const plans = [
  {
    key: null,
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    color: "var(--text-secondary)",
    features: [
      { text: "10 product descriptions/mo", included: true },
      { text: "10 collection descriptions/mo", included: true },
      { text: "Single generation", included: true },
      { text: "Bulk generation", included: true },
      { text: "Disable auto-push to Shopify", included: false },
      { text: "Brand voice memory", included: false },
      { text: "Auto-generate on new products", included: false },
      { text: "Multi-language", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    key: "Starter",
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    color: "#5c6ac4",
    popular: true,
    features: [
      { text: "100 product descriptions/mo", included: true },
      { text: "100 collection descriptions/mo", included: true },
      { text: "Single generation", included: true },
      { text: "Bulk generation", included: true },
      { text: "Disable auto-push to Shopify", included: true },
      { text: "Brand voice memory", included: true },
      { text: "Auto-generate on new products", included: false },
      { text: "Multi-language", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    key: "Pro",
    id: "pro",
    name: "Pro",
    monthlyPrice: 49,
    color: "#008060",
    features: [
      { text: "Unlimited product descriptions", included: true },
      { text: "Unlimited collection descriptions", included: true },
      { text: "Single generation", included: true },
      { text: "Bulk generation", included: true },
      { text: "Disable auto-push to Shopify", included: true },
      { text: "Brand voice memory", included: true },
      { text: "Auto-generate on new products", included: true },
      { text: "Multi-language", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function Plan() {
  const { currentPlan } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Plan & Billing">
      <div style={{ padding: "8px 0 24px" }}>
        <p style={{ margin: "0 0 24px", fontSize: "15px", color: "var(--text-secondary)", textAlign: "center" }}>
          Choose the plan that fits your store. Cancel anytime.
        </p>

        <div style={{ display: "flex", gap: "20px", flexWrap: "nowrap", justifyContent: "center", overflowX: "auto", paddingBottom: "8px" }}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div key={plan.name} style={{
                flex: "1 1 0", minWidth: "260px", maxWidth: "320px",
                background: "var(--card-bg)",
                border: plan.popular ? `1.5px solid ${plan.color}` : "1px solid #e1e3e5",
                borderRadius: "16px", padding: "28px 24px 24px",
                display: "flex", flexDirection: "column", gap: "20px",
                boxShadow: plan.popular ? `0 8px 24px rgba(92,106,196,0.12)` : "0 1px 2px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", minHeight: "22px" }}>
                  {plan.popular && !isCurrent && (
                    <span style={{
                      background: "#5c6ac4", color: "white", fontSize: "11px", fontWeight: "700",
                      padding: "4px 14px", borderRadius: "20px", letterSpacing: "0.02em",
                    }}>
                      MOST POPULAR
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{
                      background: "#f1f2f3", color: "var(--text-secondary)", fontSize: "11px", fontWeight: "700",
                      padding: "4px 14px", borderRadius: "20px", letterSpacing: "0.02em",
                    }}>
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700", color: plan.color }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "4px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginTop: "8px" }}>$</span>
                    <span style={{ fontSize: "48px", fontWeight: "800", color: "var(--text-primary)", lineHeight: 1 }}>{plan.monthlyPrice}</span>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "30px" }}>/mo</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {plan.features.map((feature, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: feature.included ? "#e3f1ec" : "#fff4f4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", flexShrink: 0,
                      }}>
                        {feature.included ? "✓" : "✕"}
                      </span>
                      <span style={{ fontSize: "13px", color: feature.included ? "#202223" : "#b5b9bc" }}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  plan.id === "free" ? (
                    <button disabled style={{
                      padding: "14px", borderRadius: "10px", border: "none",
                      background: "var(--surface-subdued)", color: "var(--text-secondary)",
                      fontWeight: "700", fontSize: "15px", cursor: "not-allowed",
                    }}>
                      Current plan
                    </button>
                  ) : (
                    <Form method="post">
                      <input type="hidden" name="intent" value="cancel" />
                      <button type="submit" style={{
                        width: "100%", padding: "14px", borderRadius: "10px",
                        border: "1px solid #d72c0d", background: "var(--card-bg)", color: "#d72c0d",
                        fontWeight: "700", fontSize: "15px", cursor: "pointer",
                      }}>
                        Cancel subscription
                      </button>
                    </Form>
                  )
                ) : plan.key ? (
                  <Form method="post">
                    <input type="hidden" name="plan" value={plan.key} />
                    <button type="submit" style={{
                      width: "100%", padding: "14px", borderRadius: "10px", border: "none",
                      background: plan.color, color: "white",
                      fontWeight: "700", fontSize: "15px", cursor: "pointer",
                    }}>
                      Upgrade to {plan.name}
                    </button>
                  </Form>
                ) : (
                  <div style={{ padding: "14px" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
