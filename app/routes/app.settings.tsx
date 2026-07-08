import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings, updateSettings } from "../models/settings.server";
import { LANGUAGES } from "../models/languages";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const autoUpdateProductTitle = formData.get("autoUpdateProductTitle") === "on";
  const autoUpdateCollectionTitle = formData.get("autoUpdateCollectionTitle") === "on";
  const defaultLanguage = (formData.get("defaultLanguage") as string) || "en";
  const brandVoice = (formData.get("brandVoice") as string) || "";
  const autoGenerateOnNewProducts = formData.get("autoGenerateOnNewProducts") === "on";

  const settings = await updateSettings(session.shop, {
    autoUpdateProductTitle,
    autoUpdateCollectionTitle,
    defaultLanguage,
    brandVoice,
    autoGenerateOnNewProducts,
  });

  return { settings, saved: true };
};

const BRAND_VOICE_EXAMPLES = [
  "Playful and fun, uses emojis, speaks directly to Gen Z",
  "Luxury and minimalist, elegant vocabulary, no exclamation marks",
  "Warm and expert, like a knowledgeable friend giving advice",
  "Bold and confident, short punchy sentences, action-oriented",
];

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [autoTitleProducts, setAutoTitleProducts] = useState(settings.autoUpdateProductTitle);
  const [autoTitleCollections, setAutoTitleCollections] = useState(settings.autoUpdateCollectionTitle);
  const [language, setLanguage] = useState(settings.defaultLanguage);
  const [brandVoice, setBrandVoice] = useState(settings.brandVoice || "");
  const isPro = settings.plan === "pro";
  const isStarterPlus = settings.plan === "starter" || settings.plan === "pro";
  const [autoGenerateNew, setAutoGenerateNew] = useState(settings.autoGenerateOnNewProducts || false);

  const isSaving = fetcher.state !== "idle";
  const justSaved = fetcher.data?.saved && fetcher.state === "idle";

  const handleSave = () => {
    fetcher.submit(
      {
        autoUpdateProductTitle: autoTitleProducts ? "on" : "off",
        autoUpdateCollectionTitle: autoTitleCollections ? "on" : "off",
        defaultLanguage: language,
        brandVoice,
        autoGenerateOnNewProducts: autoGenerateNew ? "on" : "off",
      },
      { method: "POST" }
    );
  };

  return (
    <s-page heading="Settings">
      <div style={{ display: "grid", gridTemplateColumns: "30% 70%", gap: "20px" }}>

        {/* LEFT — Info (30%) */}
        <div style={{
          background: "var(--surface-subdued)", border: "1px solid var(--card-border)", borderRadius: "12px",
          padding: "24px", height: "fit-content",
        }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
            About these settings
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Control how AI-generated content is applied to your store. These preferences apply to every generation — single or bulk.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Title updates</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                When enabled, AI will also rewrite the title. When disabled, only the description and SEO fields are updated.
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Language</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                All generated copy will be written in this language.
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Brand voice</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Describe your brand's tone once — AI will use it automatically for every generation, so you never have to repeat it.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Content (70%) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Brand voice</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Describe your brand's tone — AI will match it in every generation.</p>
              </div>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px",
                background: "#e3e6fc", color: "#5c6ac4", whiteSpace: "nowrap",
              }}>
                STARTER+
              </span>
            </div>

            <textarea
              value={isStarterPlus ? brandVoice : ""}
              onChange={(e) => setBrandVoice(e.target.value)}
              disabled={!isStarterPlus}
              placeholder="e.g. Playful and energetic, speaks directly to young athletes, uses short punchy sentences and the occasional emoji. Never overly formal."
              style={{
                width: "100%", padding: "12px", borderRadius: "8px",
                border: "1px solid #c9cccf", fontSize: "13px", fontFamily: "inherit",
                resize: "vertical", minHeight: "110px", boxSizing: "border-box",
                background: isStarterPlus ? "white" : "#f6f6f7",
                color: isStarterPlus ? "#202223" : "#b5b9bc",
                cursor: isStarterPlus ? "text" : "not-allowed",
              }}
            />

            {isStarterPlus ? (
              <div style={{ marginTop: "12px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Need inspiration? Click to use:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {BRAND_VOICE_EXAMPLES.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setBrandVoice(example)}
                      style={{
                        textAlign: "left", padding: "8px 12px", borderRadius: "6px",
                        border: "1px solid var(--card-border)", background: "var(--surface-subdued)",
                        fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer",
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Brand voice is a Starter feature. <a href="/app/plan" style={{ color: "#008060", fontWeight: "600" }}>Upgrade to unlock →</a>
              </p>
            )}
          </div>

          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Title behavior</h2>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px",
                background: "#e3e6fc", color: "#5c6ac4", whiteSpace: "nowrap",
              }}>
                STARTER+
              </span>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-secondary)" }}>Choose whether AI can rewrite titles automatically.</p>

            <label style={{
              display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "8px",
              border: "1px solid var(--card-border)", cursor: isStarterPlus ? "pointer" : "not-allowed", marginBottom: "12px",
              opacity: isStarterPlus ? 1 : 0.6,
            }}>
              <input
                type="checkbox"
                checked={isStarterPlus ? autoTitleProducts : true}
                onChange={(e) => setAutoTitleProducts(e.target.checked)}
                disabled={!isStarterPlus}
                style={{ marginTop: "2px", width: "18px", height: "18px", cursor: isStarterPlus ? "pointer" : "not-allowed" }}
              />
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                  Auto-update product titles
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                  {isStarterPlus
                    ? (autoTitleProducts
                        ? "AI will rewrite the title along with the description."
                        : "AI will only update the description — the current title stays unchanged.")
                    : "Free plan always updates the title along with the description."}
                </p>
              </div>
            </label>

            <label style={{
              display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "8px",
              border: "1px solid var(--card-border)", cursor: isStarterPlus ? "pointer" : "not-allowed",
              opacity: isStarterPlus ? 1 : 0.6,
            }}>
              <input
                type="checkbox"
                checked={isStarterPlus ? autoTitleCollections : true}
                onChange={(e) => setAutoTitleCollections(e.target.checked)}
                disabled={!isStarterPlus}
                style={{ marginTop: "2px", width: "18px", height: "18px", cursor: isStarterPlus ? "pointer" : "not-allowed" }}
              />
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                  Auto-update collection titles
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                  {isStarterPlus
                    ? (autoTitleCollections
                        ? "AI will rewrite the collection title along with the description."
                        : "AI will only update the description — the current title stays unchanged.")
                    : "Free plan always updates the title along with the description."}
                </p>
              </div>
            </label>

            {!isStarterPlus && (
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Title behavior control is a Starter feature. <a href="/app/plan" style={{ color: "#008060", fontWeight: "600" }}>Upgrade to unlock →</a>
              </p>
            )}
          </div>

          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Default language</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>All generated content will be written in this language.</p>
              </div>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px",
                background: "#e3f1ec", color: "#008060", whiteSpace: "nowrap",
              }}>
                PRO
              </span>
            </div>

            <select
              value={isPro ? language : "en"}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!isPro}
              style={{
                width: "100%", maxWidth: "320px", padding: "12px", borderRadius: "8px",
                border: "1px solid #c9cccf", fontSize: "14px",
                background: isPro ? "white" : "#f6f6f7",
                color: isPro ? "#202223" : "#b5b9bc",
                cursor: isPro ? "pointer" : "not-allowed",
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            {!isPro && (
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Multi-language is a Pro feature. <a href="/app/plan" style={{ color: "#008060", fontWeight: "600" }}>Upgrade to unlock →</a>
              </p>
            )}
          </div>

          <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Auto-generate on new products</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Automatically write and push a description whenever a new product is added to your store — no manual action needed.</p>
              </div>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px",
                background: "#e3f1ec", color: "#008060", whiteSpace: "nowrap",
              }}>
                PRO
              </span>
            </div>

            <label style={{
              display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "8px",
              border: "1px solid var(--card-border)", cursor: isPro ? "pointer" : "not-allowed",
              opacity: isPro ? 1 : 0.6,
            }}>
              <input
                type="checkbox"
                checked={isPro ? autoGenerateNew : false}
                onChange={(e) => setAutoGenerateNew(e.target.checked)}
                disabled={!isPro}
                style={{ marginTop: "2px", width: "18px", height: "18px", cursor: isPro ? "pointer" : "not-allowed" }}
              />
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                  Enable auto-generation
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                  {isPro
                    ? (autoGenerateNew
                        ? "New products will be described automatically using your brand voice and language settings."
                        : "Off — new products will need a manual generation as usual.")
                    : "Auto-generate on new products is a Pro feature."}
                </p>
              </div>
            </label>

            {!isPro && (
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Auto-generate on new products is a Pro feature. <a href="/app/plan" style={{ color: "#008060", fontWeight: "600" }}>Upgrade to unlock →</a>
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "12px 28px", borderRadius: "8px", border: "none",
                background: isSaving ? "#c9cccf" : "#008060", color: "white",
                fontWeight: "700", fontSize: "14px", cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
            {justSaved && (
              <span style={{ fontSize: "13px", color: "#008060", fontWeight: "600" }}>✓ Saved</span>
            )}
          </div>

        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
