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
  return createServerFn().handler(impl);
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
  import("../suppliers/zipFulfillment.functions");

const supplierSync = () =>
  import("../suppliers/supplierSync.server");

// Utilities
const moderation = () => import("../moderation.functions");
const profile = () => import("../profile.functions");

// =================================================
// NGO
// =================================================

export const listNgoApplications = fn(
  async (...args: any[]) =>
    (await ngo()).listNgoApplications?.(...args) ?? []
);

export const updateNgoStatus = fn(
  async (...args: any[]) =>
    (await ngo()).updateNgoStatus?.(...args)
);

export const submitNgoApplication = fn(
  async (...args: any[]) =>
    (await ngo()).submitNgoApplication?.(...args)
);

export const checkIsAdmin = fn(
  async (...args: any[]) =>
    (await ngo()).checkIsAdmin?.(...args) ?? false
);

// =================================================
// MATCH
// =================================================

export const listMatchesForControl = fn(
  async (...args: any[]) =>
    (await match()).listMatchesForControl?.(...args) ?? {
      matches: [],
    }
);

export const approveMatch = fn(
  async (...args: any[]) =>
    (await match()).approveMatch?.(...args)
);

export const rejectMatch = fn(
  async (...args: any[]) =>
    (await match()).rejectMatch?.(...args)
);

export const executeMatch = fn(
  async (...args: any[]) =>
    (await match()).executeMatch?.(...args)
);

export const listFulfillmentForMatch = fn(
  async (...args: any[]) =>
    (await match()).listFulfillmentForMatch?.(...args) ?? {
      events: [],
    }
);

// =================================================
// CAMPAIGNS
// =================================================

export const getCampaignByHandle = fn(
  async (...args: any[]) =>
    (await campaigns()).getCampaignByHandle?.(...args) ?? {}
);

export const listCampaignsByCategory = fn(
  async (...args: any[]) =>
    (await campaigns()).listCampaignsByCategory?.(...args) ?? []
);

// =================================================
// SPONSORS
// =================================================

export const listSponsors = fn(
  async (...args: any[]) =>
    (await sponsor()).listSponsors?.(...args) ?? []
);

export const updateSponsorStatus = fn(
  async (...args: any[]) =>
    (await sponsor()).updateSponsorStatus?.(...args)
);

export const createSponsorProfile = fn(
  async (...args: any[]) =>
    (await sponsor()).createSponsorProfile?.(...args)
);

export const getMySponsorProfile = fn(
  async (...args: any[]) =>
    (await sponsor()).getMySponsorProfile?.(...args) ?? {}
);

export const getSponsorRecommendations = fn(
  async (...args: any[]) =>
    (await sponsor()).getSponsorRecommendations?.(...args) ?? []
);

export const listSponsorInvoices = fn(
  async (...args: any[]) =>
    (await sponsor()).listSponsorInvoices?.(...args) ?? []
);

export const updateSponsorAssets = fn(
  async (...args: any[]) =>
    (await sponsor()).updateSponsorAssets?.(...args)
);

export const getMySponsorDocUrl = fn(
  async (...args: any[]) =>
    (await sponsor()).getMySponsorDocUrl?.(...args) ?? ""
);

// =================================================
// CHECKOUT
// =================================================

export const createBlessingCheckout = fn(
  async (...args: any[]) =>
    (await checkout()).createBlessingCheckout?.(...args)
);

export const verifyFulfillmentBeforeCheckout = fn(
  async (...args: any[]) =>
    (await checkout()).verifyFulfillmentBeforeCheckout?.(...args)
);

export const verifyFundingPackage = fn(
  async (...args: any[]) =>
    (await checkout()).verifyFundingPackage?.(...args)
);

export const getShopifyCredentials = fn(
  async (...args: any[]) =>
    (await shopify()).getShopifyCredentials?.(...args)
);

// =================================================
// PETRI
// =================================================

export const allocateStabilizationSponsor = fn(
  async (...args: any[]) =>
    (await petri()).allocateStabilizationSponsor?.(...args)
);

export const recomputePetriScores = fn(
  async (...args: any[]) =>
    (await petri()).recomputePetriScores?.(...args)
);

export const recomputePetriScoresCore = fn(
  async (...args: any[]) =>
    (await petri()).recomputePetriScoresCore?.(...args)
);

// =================================================
// SUPPLIERS
// =================================================

export const isZipFulfillable = fn(
  async (...args: any[]) =>
    (await supplierZip()).isZipFulfillable?.(...args) ?? true
);

export const getActiveSuppliersByZip = fn(
  async (...args: any[]) =>
    (await supplierZip()).getActiveSuppliersByZip?.(...args) ?? []
);

// =================================================
// CRON
// =================================================

export const runSupplierVerificationCycle = fn(
  async (...args: any[]) =>
    (await cron()).runSupplierVerificationCycle?.(...args)
);

export const startSupplierVerificationCron = fn(
  async (...args: any[]) =>
    (await cron()).startSupplierVerificationCron?.(...args)
);

// =================================================
// ADMIN / SYSTEM
// =================================================

export const getCommandCenterSnapshot = fn(
  async (...args: any[]) =>
    (await stats()).getCommandCenterSnapshot?.(...args) ?? {}
);

export const listImpactReports = fn(
  async (...args: any[]) =>
    (await stats()).listImpactReports?.(...args) ?? []
);

export const approveFlywheelReport = fn(
  async (...args: any[]) =>
    (await stats()).approveFlywheelReport?.(...args)
);

// =================================================
// STATS
// =================================================

export const getPublicStats = fn(
  async (...args: any[]) =>
    (await stats()).getPublicStats?.(...args) ?? {
      total: 0,
    }
);

export const getLifecycleCounts = fn(
  async (...args: any[]) =>
    (await stats()).getLifecycleCounts?.(...args) ?? {
      requested: 0,
      matched: 0,
      funded: 0,
      delivered: 0,
      storyPublished: 0,
      followupActive: 0,
    }
);

export const getImpactMapData = fn(
  async (...args: any[]) =>
    (await stats()).getImpactMapData?.(...args) ?? []
);

export const getMarketplaceFeed = fn(
  async (...args: any[]) =>
    (await stats()).getMarketplaceFeed?.(...args) ?? []
);

// =================================================
// PROFILE
// =================================================

export const getMyProfile = fn(
  async (...args: any[]) =>
    (await profile()).getMyProfile?.(...args) ?? {}
);

export const updateMyProfile = fn(
  async (...args: any[]) =>
    (await profile()).updateMyProfile?.(...args)
);

export const moderateImage = fn(
  async (...args: any[]) =>
    (await moderation()).moderateImage?.(...args)
);

export const getMyGiving = fn(
  async (...args: any[]) =>
    (await profile()).getMyGiving?.(...args) ?? {}
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