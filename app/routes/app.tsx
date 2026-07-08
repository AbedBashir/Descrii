import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

// Shared theme tokens for all custom-styled cards across the app.
// Every page uses var(--...) instead of hardcoded colors, so this
// single block controls both light and dark mode everywhere.
const themeStyles = `
  :root {
    --card-bg: #ffffff;
    --text-primary: #202223;
    --text-secondary: #6d7175;
    --text-disabled: #b5b9bc;
    --card-border: #e1e3e5;
    --surface-subdued: #f6f6f7;
    --danger-bg: #fff4f4;
    --danger-border: #fd5749;
    --danger-text: #d72c0d;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --card-bg: #202020;
      --text-primary: #f1f2f3;
      --text-secondary: #b5b9bc;
      --text-disabled: #6d7175;
      --card-border: #3a3a3a;
      --surface-subdued: #2a2a2a;
      --danger-bg: #3a1414;
      --danger-border: #d72c0d;
      --danger-text: #ff8a80;
    }
  }
`;

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/collections">Collections</s-link>
        <s-link href="/app/plan">Plan</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      <Outlet />
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: "10px", padding: "24px 0 32px", fontSize: "12px",
      }}>
        <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Privacy Policy
        </a>
        <span style={{ color: "var(--text-disabled)" }}>·</span>
        <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          Terms of Service
        </a>
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
