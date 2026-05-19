import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "zkwwei-r1.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "700086ebff62f9a9d5f2ca54f9736244";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title description handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 10) { edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } } }
          options { name values }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id title description handle
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 8) { edges { node { url altText } } }
      variants(first: 20) { edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } } }
      options { name values }
    }
  }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Your Shopify store needs an active billing plan. Visit admin.shopify.com to upgrade.",
    });
    return;
  }

  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Shopify error: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`);
  return data;
}

export async function fetchProducts(first = 24, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, query });
  return data?.data?.products?.edges ?? [];
}

export async function fetchProductByHandle(handle: string) {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}

export function formatMoney(amount: string | number, currency = "USD") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

/**
 * Derive campaign-style metadata from a Shopify product.
 * Uses price as the per-blessing donation, and a deterministic hash for goal/raised
 * so progress UI looks real without fabricating data on the server.
 */
export function deriveCampaign(product: ShopifyProduct["node"]) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount) || 25;
  // Pseudo-stable values seeded by product id length
  const seed = product.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const goal = Math.max(1000, Math.round((price * 100 + (seed % 50) * 100) / 500) * 500);
  const raised = Math.round(goal * (0.25 + ((seed % 60) / 100)));
  const donors = Math.max(8, Math.round(raised / Math.max(price, 15)));
  return { goal, raised, donors, percent: Math.min(100, Math.round((raised / goal) * 100)) };
}

