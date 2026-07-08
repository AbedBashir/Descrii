export default function Privacy() {
  return (
    <div style={{
      maxWidth: "760px", margin: "0 auto", padding: "60px 24px 100px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#202223", lineHeight: "1.7",
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
        Privacy Policy
      </h1>
      <p style={{ color: "#6d7175", fontSize: "14px", marginBottom: "40px" }}>
        Last updated: July 8, 2026
      </p>

      <p style={{ marginBottom: "24px" }}>
        AI Descriptions Generator ("the app", "we", "us") is a Shopify app built by FUSIONS
        that generates product, collection, and marketing copy using AI. This policy explains
        what information the app accesses, how it's used, and how it's protected.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Information we collect
      </h2>
      <p style={{ marginBottom: "12px" }}>The app collects and stores the following:</p>
      <ul style={{ marginBottom: "24px", paddingLeft: "20px" }}>
        <li style={{ marginBottom: "8px" }}>
          <strong>Store settings</strong> — your chosen brand voice description, default language,
          title-update preferences, and current subscription plan.
        </li>
        <li style={{ marginBottom: "8px" }}>
          <strong>Usage records</strong> — a count and timestamp of each product or collection
          description generated, used solely to enforce your plan's monthly limits.
        </li>
        <li style={{ marginBottom: "8px" }}>
          <strong>Product and collection content</strong> — titles, descriptions, and related
          fields you choose to generate or update. This content is sent to our AI provider
          to produce new copy, and the result is written back to your store via the Shopify
          Admin API.
        </li>
        <li style={{ marginBottom: "8px" }}>
          <strong>Access tokens</strong> — standard OAuth session tokens issued by Shopify,
          used to authenticate API requests to your store.
        </li>
      </ul>

      <p style={{ marginBottom: "24px", padding: "16px", background: "#f6f6f7", borderRadius: "8px" }}>
        <strong>We do not collect, store, or process any customer personal data.</strong> The
        app has no access to and does not request customer names, emails, addresses, order
        history, or any other customer-identifiable information.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        How we use this information
      </h2>
      <p style={{ marginBottom: "24px" }}>
        Store settings and usage records are used exclusively to operate the app: applying
        your preferences to each generation, enforcing plan limits, and keeping your billing
        status in sync with Shopify. Product and collection content you submit for generation
        is used only to produce the requested copy — it is not used to train AI models, sold,
        or shared with any party other than the AI provider processing your request.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Third-party services
      </h2>
      <p style={{ marginBottom: "12px" }}>The app relies on the following third parties:</p>
      <ul style={{ marginBottom: "24px", paddingLeft: "20px" }}>
        <li style={{ marginBottom: "8px" }}>
          <strong>Anthropic</strong> — processes the product/collection details you submit to
          generate AI copy. See{" "}
          <a href="https://www.anthropic.com/legal/privacy" style={{ color: "#008060" }}>
            Anthropic's privacy policy
          </a>.
        </li>
        <li style={{ marginBottom: "8px" }}>
          <strong>Shopify</strong> — provides the platform, authentication, and billing
          infrastructure the app runs on. See{" "}
          <a href="https://www.shopify.com/legal/privacy" style={{ color: "#008060" }}>
            Shopify's privacy policy
          </a>.
        </li>
      </ul>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Data retention and deletion
      </h2>
      <p style={{ marginBottom: "24px" }}>
        Store settings and usage records are retained for as long as the app is installed.
        If you uninstall the app, all associated data is permanently deleted from our systems
        within 48 hours, in compliance with Shopify's mandatory data protection requirements.
        You can request earlier deletion at any time by contacting us below.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Your rights
      </h2>
      <p style={{ marginBottom: "24px" }}>
        You may request access to, correction of, or deletion of any store-level data the
        app holds about your shop at any time. Since the app does not process customer
        personal data, no customer-level data requests apply.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Changes to this policy
      </h2>
      <p style={{ marginBottom: "24px" }}>
        We may update this policy from time to time. Material changes will be reflected by
        updating the date at the top of this page.
      </p>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "12px" }}>
        Contact us
      </h2>
      <p style={{ marginBottom: "8px" }}>
        Questions about this policy or your data can be sent to:
      </p>
      <p>
        <a href="mailto:support@fusions.agency" style={{ color: "#008060" }}>
          support@fusions.agency
        </a>
      </p>
    </div>
  );
}
