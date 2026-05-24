// src/server/api/gateway.ts
// Stable Public API Surface (permissive stubs for UI compatibility).

export type { Campaign } from "@/server/campaigns.functions.server";

export type LifecycleCounts = {
  requested: number;
  matched: number;
  funded: number;
  delivered: number;
  storyPublished: number;
  followupActive: number;
};

const emptyLifecycle = (): LifecycleCounts => ({
  requested: 0, matched: 0, funded: 0, delivered: 0, storyPublished: 0, followupActive: 0,
});

type Any = any;
const ok = async (..._args: Any[]): Promise<Any> => ({ ok: true });
const arr = async (..._args: Any[]): Promise<Any[]> => [];

export const Gateway = { sponsor: {} as Record<string, unknown> };
export const gateway = Gateway;
export type GatewayType = typeof Gateway;

// Sponsor
export const createSponsorProfile = ok;
export const getMySponsorProfile = async (..._a: Any[]): Promise<Any> => ({ profile: null, sponsor: null });
export const listSponsors = async (..._a: Any[]): Promise<Any> => ({ sponsors: [] as Any[] });
export const updateSponsorStatus = ok;
export const getSponsorRecommendations = async (..._a: Any[]): Promise<Any> => ({ recommendations: [] as Any[] });
export const listSponsorInvoices = async (..._a: Any[]): Promise<Any> => ({ invoices: [] as Any[] });
export const updateSponsorAssets = async (..._a: Any[]): Promise<Any> => ({ ok: true, logoUrl: "", docUrl: "" });
export const getMySponsorDocUrl = async (..._a: Any[]): Promise<Any> => ({ url: "" });
export const moderateImage = async (..._a: Any[]): Promise<Any> => ({ approved: true, allow: true, reason: "" });

// Checkout
export const createBlessingCheckout = async (..._a: Any[]): Promise<Any> => ({});
export const verifyFulfillmentBeforeCheckout = async (..._a: Any[]): Promise<Any> => ({ fulfillable: true });
export const verifyFundingPackage = async (..._a: Any[]) => true;

// Petri
export const recomputePetriScores = ok;
export const recomputePetriScoresCore = ok;
export const allocateStabilizationSponsor = async (..._a: Any[]): Promise<Any> => ({
  ok: true, fulfillable: true, allocation_score: 0,
  matched_supplier_id: null, matched_blessee_id: null, reasoning: [] as string[],
});

// NGO
export const listNgoApplications = async (..._a: Any[]): Promise<Any> => ({ applications: [] as Any[] });
export const submitNgoApplication = ok;
export const updateNgoStatus = ok;

// Zip / supplier
export const isZipFulfillable = async (..._a: Any[]): Promise<Any> => ({
  fulfillable: true, zip: "", active: true, supplier_count: 0, supplierCount: 0,
});
export const getActiveSuppliersByZip = arr;
export const runSupplierVerificationCycle = ok;
export const startSupplierVerificationCron = ok;

// Shopify
export const getShopifyCredentials = async (..._a: Any[]): Promise<Any> => ({ domain: "", token: "" });

// Command center
export const getCommandCenterSnapshot = async (..._a: Any[]): Promise<Any> => ({});
export const getLifecycleCounts = async (..._a: Any[]): Promise<LifecycleCounts> => emptyLifecycle();

// Finance / reporting
export const listImpactReports = async (..._a: Any[]): Promise<Any> => ({ reports: [] as Any[] });
export const approveFlywheelReport = ok;

// Profile / giving / marketplace / impact map
export const getMyProfile = async (..._a: Any[]): Promise<Any> => ({ profile: null });
export const updateMyProfile = ok;
export const getMyGiving = async (..._a: Any[]): Promise<Any> => ({ donations: [] as Any[], totalAmount: 0, count: 0 });
export const getMarketplaceFeed = async (..._a: Any[]): Promise<Any> => ({ campaigns: [] as Any[] });
export const getImpactMapData = async (..._a: Any[]): Promise<Any> => ({ regions: [] as Any[] });

// Match control
export const listMatchesForControl = async (..._a: Any[]): Promise<Any> => ({ matches: [] as Any[] });
export const approveMatch = ok;
export const rejectMatch = ok;
export const executeMatch = ok;
export const listFulfillmentForMatch = async (..._a: Any[]): Promise<Any> => ({ events: [] as Any[] });

// UI utility
export const cn = (...classes: Any[]) => classes.filter(Boolean).join(" ");


// Campaigns / categories pass-through stubs
export const listCategories = async (..._a: Any[]): Promise<Any> => ({ categories: [] as Any[] });
export const listCampaignsByCategory = async (..._a: Any[]): Promise<Any> => ({ category: null, campaigns: [] as Any[] });
export const getCampaignByHandle = async (..._a: Any[]): Promise<Any> => ({ campaign: null, donations: [] as Any[] });

// Re-export supabase admin for legacy services
export { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
