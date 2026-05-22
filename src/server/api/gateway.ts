import { createServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";

export { cn };

export type Campaign = {
  id: string;
  handle: string;
  title: string;
  story: string | null;
  short_description: string | null;
  image_url: string | null;
  beneficiary_name: string | null;
  location: string | null;
  goal_amount: number;
  raised_amount: number;
  donor_count: number;
  currency: string;
  status: string;
  featured: boolean;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  category_slug?: string | null;
};

export type LifecycleCounts = {
  requested: number;
  matched: number;
  funded: number;
  delivered: number;
  storyPublished: number;
  followupActive: number;
};

/**
 * ===========================
 * GATEWAY OS — STABLE CONTRACT LAYER
 * ===========================
 * Rules:
 * - NO top-level await imports
 * - ALL modules are lazy-loaded
 * - ALL server access goes through fn()
 */

// =================================================
// WRAPPER
// =================================================

function fn<T extends (...args: any[]) => any>(impl: T) {
  return createServerFn({ method: "POST" })
    .inputValidator((input: unknown) => input)
    .handler((ctx: any) => impl(ctx));
}

// =================================================
// MODULE LOADERS
// =================================================

// NGO
const ngo = () => import("../ngo.functions.server");

// Core
const checkout = () => import("../checkout.functions");
const cron = () => import("../cron/supplierVerification.cron");
const shopify = () => import("../shopify");

// Domain
const match = () => import("../match-control.functions");
const campaigns = () => import("../campaigns.functions");
const sponsor = () => import("../sponsor.functions");
const stats = () => import("../stats.functions");
const petri = () => import("../petri-recompute.functions");

// Suppliers
const supplierZip = () =>
  import("../suppliers/zipFulfillment.server");

const supplierSync = () =>
  import("../suppliers/supplierSync.server");

// Utilities
const moderation = () => import("../moderation.functions");
const profile = () => import("../profile.functions");

// =================================================
// NGO
// =================================================

export const listNgoApplications = fn(
  async (ctx: any) =>
    (await ngo()).listNgoApplications?.(ctx) ?? []
);

export const updateNgoStatus = fn(
  async (ctx: any) =>
    (await ngo()).updateNgoStatus?.(ctx)
);

export const submitNgoApplication = fn(
  async (ctx: any) =>
    (await ngo()).submitNgoApplication?.(ctx)
);

export const checkIsAdmin = fn(
  async (ctx: any) =>
    (await ngo()).checkIsAdmin?.(ctx) ?? false
);

// =================================================
// MATCH
// =================================================

export const listMatchesForControl = fn(
  async (ctx: any) =>
    (await match()).listMatchesForControl?.(ctx) ?? {
      matches: [],
    }
);

export const approveMatch = fn(
  async (ctx: any) =>
    (await match()).approveMatch?.(ctx)
);

export const rejectMatch = fn(
  async (ctx: any) =>
    (await match()).rejectMatch?.(ctx)
);

export const executeMatch = fn(
  async (ctx: any) =>
    (await match()).executeMatch?.(ctx)
);

export const listFulfillmentForMatch = fn(
  async (ctx: any) =>
    (await match()).listFulfillmentForMatch?.(ctx) ?? {
      events: [],
    }
);

// =================================================
// CAMPAIGNS
// =================================================

export const getCampaignByHandle = fn(
  async (ctx: any) =>
    (await campaigns()).getCampaignByHandle?.(ctx) ?? {}
);

export const listCampaignsByCategory = fn(
  async (ctx: any) =>
    (await campaigns()).listCampaignsByCategory?.(ctx) ?? []
);

// =================================================
// SPONSORS
// =================================================

export const listSponsors = fn(
  async (ctx: any) =>
    (await sponsor()).listSponsors?.(ctx) ?? []
);

export const updateSponsorStatus = fn(
  async (ctx: any) =>
    (await sponsor()).updateSponsorStatus?.(ctx)
);

export const createSponsorProfile = fn(
  async (ctx: any) =>
    (await sponsor()).createSponsorProfile?.(ctx)
);

export const getMySponsorProfile = fn(
  async (ctx: any) =>
    (await sponsor()).getMySponsorProfile?.(ctx) ?? {}
);

export const getSponsorRecommendations = fn(
  async (ctx: any) =>
    (await sponsor()).getSponsorRecommendations?.(ctx) ?? []
);

export const listSponsorInvoices = fn(
  async (ctx: any) =>
    (await sponsor()).listSponsorInvoices?.(ctx) ?? []
);

export const updateSponsorAssets = fn(
  async (ctx: any) =>
    (await sponsor()).updateSponsorAssets?.(ctx)
);

export const getMySponsorDocUrl = fn(
  async (ctx: any) =>
    (await sponsor()).getMySponsorDocUrl?.(ctx) ?? ""
);

// =================================================
// CHECKOUT
// =================================================

export const createBlessingCheckout = fn(
  async (ctx: any) =>
    (await checkout()).createBlessingCheckout?.(ctx)
);

export const verifyFulfillmentBeforeCheckout = fn(
  async (ctx: any) =>
    (await checkout()).verifyFulfillmentBeforeCheckout?.(ctx)
);

export const verifyFundingPackage = fn(
  async (ctx: any) =>
    (await checkout()).verifyFundingPackage?.(ctx)
);

export const getShopifyCredentials = fn(
  async (ctx: any) =>
    (await shopify()).getShopifyCredentials?.(ctx)
);

// =================================================
// PETRI
// =================================================

export const allocateStabilizationSponsor = fn(
  async (ctx: any) =>
    (await petri()).allocateStabilizationSponsor?.(ctx)
);

export const recomputePetriScores = fn(
  async (ctx: any) =>
    (await petri()).recomputePetriScores?.(ctx)
);

export const recomputePetriScoresCore = fn(
  async (ctx: any) =>
    (await petri()).recomputePetriScoresCore?.(ctx)
);

// =================================================
// SUPPLIERS
// =================================================

export const isZipFulfillable = fn(
  async (ctx: any) =>
    (await supplierZip()).isZipFulfillable?.(ctx) ?? true
);

export const getActiveSuppliersByZip = fn(
  async (ctx: any) =>
    (await supplierZip()).getActiveSuppliersByZip?.(ctx) ?? []
);

// =================================================
// CRON
// =================================================

export const runSupplierVerificationCycle = fn(
  async (ctx: any) =>
    (await cron()).runSupplierVerificationCycle?.(ctx)
);

export const startSupplierVerificationCron = fn(
  async (ctx: any) =>
    (await cron()).startSupplierVerificationCron?.(ctx)
);

// =================================================
// ADMIN / SYSTEM
// =================================================

export const getCommandCenterSnapshot = fn(
  async (ctx: any) =>
    (await stats()).getCommandCenterSnapshot?.(ctx) ?? {}
);

export const listImpactReports = fn(
  async (ctx: any) =>
    (await stats()).listImpactReports?.(ctx) ?? []
);

export const approveFlywheelReport = fn(
  async (ctx: any) =>
    (await stats()).approveFlywheelReport?.(ctx)
);

// =================================================
// STATS
// =================================================

export const getPublicStats = fn(
  async (ctx: any) =>
    (await stats()).getPublicStats?.(ctx) ?? {
      total: 0,
    }
);

export const getLifecycleCounts = fn(
  async (ctx: any) =>
    (await stats()).getLifecycleCounts?.(ctx) ?? {
      requested: 0,
      matched: 0,
      funded: 0,
      delivered: 0,
      storyPublished: 0,
      followupActive: 0,
    }
);

export const getImpactMapData = fn(
  async (ctx: any) =>
    (await stats()).getImpactMapData?.(ctx) ?? []
);

export const getMarketplaceFeed = fn(
  async (ctx: any) =>
    (await stats()).getMarketplaceFeed?.(ctx) ?? []
);

// =================================================
// PROFILE
// =================================================

export const getMyProfile = fn(
  async (ctx: any) =>
    (await profile()).getMyProfile?.(ctx) ?? {}
);

export const updateMyProfile = fn(
  async (ctx: any) =>
    (await profile()).updateMyProfile?.(ctx)
);

export const moderateImage = fn(
  async (ctx: any) =>
    (await moderation()).moderateImage?.(ctx)
);

export const getMyGiving = fn(
  async (ctx: any) =>
    (await profile()).getMyGiving?.(ctx) ?? {}
);

// =================================================
// SAFE ESCAPE HATCH
// =================================================

export const __call = fn(
  async (module: string, method: string, data: any) => {
    const mod: any = await import(`../${module}`);
    return mod?.[method]?.(data);
  }
);