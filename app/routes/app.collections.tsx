import { useState, useEffect, useRef } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { languageName } from "../models/languages";
import { checkLimit, logUsage } from "../models/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Collections() {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [extraInfo, setExtraInfo] = useState("");
  const [bulkCollections, setBulkCollections] = useState<any[]>([]);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const lastHandledKey = useRef<string | null>(null);

  const isLoading = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.pushed && fetcher.state === "idle") {
      if (lastHandledKey.current !== fetcher.data.collectionId) {
        lastHandledKey.current = fetcher.data.collectionId;
        shopify.toast.show(`"${fetcher.data.collectionName}" updated`, { duration: 4000 });
        setSelectedCollection(null);
        setExtraInfo("");
      }
    }
  }, [fetcher.data, fetcher.state, shopify]);

  const handlePickCollection = async () => {
    const selected = await shopify.resourcePicker({ type: "collection", multiple: false });
    if (selected?.length > 0) setSelectedCollection(selected[0]);
  };

  const handlePickBulkCollections = async () => {
    const selected = await shopify.resourcePicker({ type: "collection", multiple: true });
    if (selected?.length > 0) {
      setBulkCollections(selected);
      setBulkResults([]);
      setConfirmingBulk(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedCollection) return;
    fetcher.submit({
      collectionId: selectedCollection.id,
      collectionName: selectedCollection.title,
      extraInfo,
    }, { method: "POST" });
  };

  const runBulk = async () => {
    setConfirmingBulk(false);
    setBulkLoading(true);
    setBulkResults([]);
    const results = [];

    for (const col of bulkCollections) {
      try {
        const res = await fetch("/api/generate-collection", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            collectionId: col.id,
            collectionName: col.title,
            extraInfo: "",
          }),
        });

        if (!res.ok) {
          results.push({ collection: col.title, error: `Server error ${res.status}` });
          setBulkResults([...results]);
          continue;
        }

        const data = await res.json();
        results.push({ collection: col.title, ...data });
        setBulkResults([...results]);
      } catch (e: any) {
        results.push({ collection: col.title, error: e.message || "Request failed" });
        setBulkResults([...results]);
      }
    }

    setBulkLoading(false);
    const successCount = results.filter(r => r.pushed).length;
    shopify.toast.show(`${successCount} of ${results.length} collections updated`, { duration: 4000 });
  };

  const progressPct = bulkCollections.length > 0 ? Math.round((bulkResults.length / bulkCollections.length) * 100) : 0;

  return (
    <s-page heading="Collection Descriptions">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* LEFT — Single */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Single collection</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Select a collection — AI will generate and push the description directly.</p>
          </div>

          <button onClick={handlePickCollection} style={{
            padding: "10px 16px", borderRadius: "8px", border: "2px solid #008060",
            background: selectedCollection ? "#008060" : "var(--card-bg)",
            color: selectedCollection ? "white" : "#008060",
            fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
          }}>
            {selectedCollection ? `✓ ${selectedCollection.title}` : "Select collection from store"}
          </button>

          {selectedCollection && (
            <>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>Extra info (optional)</label>
                <textarea
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="Season, target audience, theme, promotion..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: "13px", fontFamily: "inherit", resize: "vertical", minHeight: "70px", boxSizing: "border-box" }}
                />
              </div>

              <button onClick={handleGenerate} disabled={isLoading} style={{
                padding: "14px", borderRadius: "8px", border: "none",
                background: isLoading ? "var(--card-border)" : "#008060",
                color: "white", fontWeight: "700", fontSize: "15px",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}>
                {isLoading ? "⏳ Generating & pushing..." : "✨ Generate & push to store"}
              </button>

              <button onClick={() => { setSelectedCollection(null); setExtraInfo(""); }} style={{
                padding: "8px", borderRadius: "8px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer",
              }}>Clear selection</button>
            </>
          )}

          {fetcher.data?.error && (
            <div style={{ padding: "12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "8px", color: "var(--danger-text)", fontSize: "13px" }}>
              <p style={{ margin: fetcher.data?.limitReached ? "0 0 10px" : 0 }}>{fetcher.data.error}</p>
              {fetcher.data?.limitReached && (
                <a href="/app/plan" style={{
                  display: "inline-block", padding: "8px 16px", borderRadius: "6px",
                  background: "#d72c0d", color: "white", fontSize: "13px", fontWeight: "600",
                  textDecoration: "none",
                }}>
                  Upgrade plan →
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Bulk */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Bulk generation</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>Select multiple collections — all descriptions pushed automatically.</p>
          </div>

          <button onClick={handlePickBulkCollections} style={{
            padding: "10px 16px", borderRadius: "8px", border: "2px solid #5c6ac4",
            background: bulkCollections.length > 0 ? "#5c6ac4" : "var(--card-bg)",
            color: bulkCollections.length > 0 ? "white" : "#5c6ac4",
            fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
          }}>
            {bulkCollections.length > 0 ? `✓ ${bulkCollections.length} collections selected` : "Select multiple collections"}
          </button>

          {bulkCollections.length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                {bulkCollections.map((c, i) => (
                  <div key={i} style={{ padding: "8px 12px", background: "var(--surface-subdued)", borderRadius: "6px", fontSize: "13px", color: "var(--text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{c.title}</span>
                    <span>
                      {bulkResults[i]?.pushed && <span style={{ color: "#008060" }}>✓ pushed</span>}
                      {bulkResults[i]?.error && <span style={{ color: "var(--danger-text)" }} title={bulkResults[i].error}>✕ failed</span>}
                      {bulkLoading && !bulkResults[i] && <span style={{ color: "var(--text-secondary)" }}>⏳</span>}
                    </span>
                  </div>
                ))}
              </div>

              {bulkLoading && (
                <div>
                  <div style={{ width: "100%", height: "8px", background: "var(--surface-subdued)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${progressPct}%`, height: "100%", background: "#5c6ac4",
                      transition: "width 0.3s ease", borderRadius: "4px",
                    }} />
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-secondary)", textAlign: "center" }}>
                    {bulkResults.length} of {bulkCollections.length} · {progressPct}%
                  </p>
                </div>
              )}

              {bulkResults.some(r => r.error) && (
                <div style={{ padding: "10px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "8px", fontSize: "12px", color: "var(--danger-text)" }}>
                  Some items failed. Hover over ✕ for details.
                </div>
              )}

              {!bulkLoading && !confirmingBulk && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setConfirmingBulk(true)} style={{
                    flex: 1, padding: "14px", borderRadius: "8px", border: "none",
                    background: "#5c6ac4", color: "white",
                    fontWeight: "700", fontSize: "15px", cursor: "pointer",
                  }}>
                    ✨ Generate & push all
                  </button>
                  <button onClick={() => { setBulkCollections([]); setBulkResults([]); }} style={{
                    padding: "14px", borderRadius: "8px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer",
                  }}>Clear</button>
                </div>
              )}

              {confirmingBulk && (
                <div style={{ padding: "14px", background: "var(--surface-subdued)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", fontWeight: "600" }}>
                    This will use {bulkCollections.length} generation{bulkCollections.length > 1 ? "s" : ""} from your monthly quota. Continue?
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={runBulk} style={{
                      flex: 1, padding: "10px", borderRadius: "6px", border: "none",
                      background: "#5c6ac4", color: "white", fontWeight: "700", fontSize: "13px", cursor: "pointer",
                    }}>
                      Yes, continue
                    </button>
                    <button onClick={() => setConfirmingBulk(false)} style={{
                      padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--card-border)",
                      background: "var(--card-bg)", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer",
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </s-page>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const collectionId = formData.get("collectionId") as string;
  const collectionName = formData.get("collectionName") as string;

  try {
    const settings = await getSettings(session.shop);
    const language = settings.plan === "pro" ? languageName(settings.defaultLanguage) : "English";

    const limitCheck = await checkLimit(session.shop, settings.plan, "collection");
    if (!limitCheck.allowed) {
      return {
        error: `You've reached your monthly limit (${limitCheck.used}/${limitCheck.limit === Infinity ? "∞" : limitCheck.limit} collections). Upgrade your plan to continue.`,
        limitReached: true,
      };
    }

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are an expert Shopify copywriter. Write everything in ${language}.${settings.brandVoice ? ` Match this brand voice: ${settings.brandVoice}` : ""} Return ONLY a valid JSON object, no extra text, no markdown.
Collection: ${collectionName}
Extra info: ${formData.get("extraInfo") || "none"}
Return: {"title":"Collection title under 60 chars","shortDescription":"1-2 sentence hook under 100 chars","fullDescription":"150-200 word description as plain text","metaTitle":"meta title under 60 chars","metaDescription":"meta description under 160 chars"}`,
        }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Claude API error:", errText);
      return { error: `AI generation failed: ${aiResponse.status}` };
    }

    const aiData = await aiResponse.json();
    const text = aiData.content[0].text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(text);

    const fullDescriptionHtml = `<p><strong>${generated.shortDescription}</strong></p><p>${generated.fullDescription}</p>`;

    const isPaid = settings.plan === "starter" || settings.plan === "pro";
    const shouldUpdateTitle = isPaid ? settings.autoUpdateCollectionTitle : true;

    const input: any = {
      id: collectionId,
      descriptionHtml: fullDescriptionHtml,
      seo: { title: generated.metaTitle, description: generated.metaDescription },
    };
    if (shouldUpdateTitle) {
      input.title = generated.title;
    }

    const shopifyResponse = await admin.graphql(
      `#graphql
      mutation updateCollection($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id title }
          userErrors { field message }
        }
      }`,
      { variables: { input } }
    );

    const shopifyJson = await shopifyResponse.json();
    const userErrors = shopifyJson.data?.collectionUpdate?.userErrors;
    if (userErrors?.length > 0) {
      console.error("Shopify error:", userErrors);
      return { error: userErrors[0].message };
    }

    const finalName = shouldUpdateTitle ? generated.title : collectionName;
    await logUsage(session.shop, "collection", finalName);

    return {
      pushed: true,
      collectionId,
      collectionName: finalName,
      shopDomain: session.shop.replace(".myshopify.com", ""),
    };
  } catch (e: any) {
    console.error("Action error:", e);
    return { error: e.message || "Failed to generate or push. Please try again." };
  }
};

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
