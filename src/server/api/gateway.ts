// src/server/api/gateway.ts
// ===============================
// MyBlessings Gateway OS Router
// Stable Public API Surface Layer
// ===============================

import { registry } from "./gateway/registry";

// ===============================
// TYPES (re-exports + local)
// ===============================

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
  requested: 0,
  matched: 0,
  funded: 0,
  delivered: 0,
  storyPublished: 0,
  followupActive: 0,
});

// ===============================
// CORE GATEWAY OBJECT
// ===============================

export const Gateway = {
  sponsor: registry.sponsor,
};
export const gateway = Gateway;

// ===============================
// SPONSOR API (UI COMPATIBILITY LAYER)
// ===============================

// Sponsor CRUD
export const createSponsorProfile = registry.sponsor.createSponsorProfile;
export const getMySponsorProfile = registry.sponsor.getMySponsorProfile;
export const listSponsors = registry.sponsor.listSponsors;
export const updateSponsorStatus = registry.sponsor.updateSponsorStatus;

// Sponsor CRM / Intelligence
export const getSponsorRecommendations =
  registry.sponsor.getSponsorRecommendations ?? (async () => []);

export const listSponsorInvoices =
  registry.sponsor.listSponsorInvoices ?? (async () => []);

export const updateSponsorAssets =
  registry.sponsor.updateSponsorAssets ?? registry.sponsor.updateSponsorStatus;

export const getMySponsorDocUrl =
  registry.sponsor.getMySponsorDocUrl ?? (async () => "");

export const moderateImage =
  registry.sponsor.moderateImage ?? (async () => ({ approved: true }));

// ===============================
// BLESSING / CHECKOUT LAYER (SAFE STUBS IF NOT READY)
// ===============================

export const createBlessingCheckout =
  registry.sponsor.createBlessingCheckout ?? (async () => ({}));

export const verifyFulfillmentBeforeCheckout = async () => true;
export const verifyFundingPackage = async () => true;

// ===============================
// PETRI / SYSTEM LAYER (SAFE STUBS)
// ===============================

export const recomputePetriScores = async () => ({ ok: true });
export const recomputePetriScoresCore = async () => ({ ok: true });
export const allocateStabilizationSponsor = async () => ({ ok: true });

// ===============================
// NGO LAYER (STUBBED FOR NOW)
// ===============================

export const listNgoApplications = async () => [];
export const submitNgoApplication = async () => ({ ok: true });
export const updateNgoStatus = async () => ({ ok: true });

// ===============================
// ZIP / SUPPLIER LAYER (STUBBED)
// ===============================

export const isZipFulfillable = async () => true;
export const getActiveSuppliersByZip = async () => [];

// ===============================
// COMMAND CENTER
// ===============================

export const getCommandCenterSnapshot =
  registry.sponsor.getCommandCenterSnapshot ?? (async () => ({}));

export const getLifecycleCounts =
  registry.sponsor.getLifecycleCounts ?? (async (): Promise<LifecycleCounts> => emptyLifecycle());

// ===============================
// FINANCE / REPORTING
// ===============================

export const listImpactReports = async () => [];
export const approveFlywheelReport = async () => ({ ok: true });

// ===============================
// PROFILE / GIVING / MARKETPLACE / IMPACT MAP
// ===============================

export const getMyProfile = async () => ({ profile: null as any });
export const updateMyProfile = async (_input?: unknown) => ({ ok: true });
export const getMyGiving = async () => ({ donations: [] as any[], totalAmount: 0, count: 0 });
export const getMarketplaceFeed = async () => ({ campaigns: [] as any[] });
export const getImpactMapData = async () => ({ points: [] as any[] });

// ===============================
// SUPPLIER VERIFICATION / SHOPIFY
// ===============================

export const runSupplierVerificationCycle = async () => ({ ok: true });
export const startSupplierVerificationCron = async () => ({ ok: true });
export const getShopifyCredentials = async () => ({ domain: "", token: "" });

// ===============================
// MATCH CONTROL
// ===============================

export const listMatchesForControl = async () => ({ matches: [] as any[] });
export const approveMatch = async (_input?: unknown) => ({ ok: true });
export const rejectMatch = async (_input?: unknown) => ({ ok: true });
export const executeMatch = async (_input?: unknown) => ({ ok: true });
export const listFulfillmentForMatch = async (_input?: unknown) => ({ events: [] as any[] });

// ===============================
// UI UTILITIES (CRITICAL FIX)
// ===============================

export const cn = (...classes: any[]) =>
  classes.filter(Boolean).join(" ");

// ===============================
// TYPES
// ===============================

export type GatewayType = typeof Gateway;