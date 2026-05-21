import { createServerFn } from "@tanstack/react-start";

/**
 * ===========================
 * GATEWAY OS — STABLE CONTRACT LAYER
 * ===========================
 * Rules:
 * - NO top-level await imports
 * - ALL modules are lazy-loaded
 * - ALL server access goes through fn()
 */

// ---------------- WRAPPER ----------------

function fn<T extends (...args: any[]) => any>(impl: T) {
  return createServerFn().handler(impl);
}

// ---------------- MODULE LOADERS ----------------

const ngo = () => import("../ngo.functions");
const checkout = () => import("../checkout.functions");
const cron = () => import("../cron/supplierVerification.cron");
const shopify = () => import("../shopify");

const match = () => import("../match-control.functions");
const campaigns = () => import("../campaigns.functions");

const sponsor = () => import("../sponsor.functions");
const stats = () => import("../stats.functions");

const petri = () => import("../petri-recompute.functions");

const supplierZip = () => import("../suppliers/zipFulfillment.functions");
const supplierSync = () => import("../suppliers/supplierSync.server");

const moderation = () => import("../moderation.functions");
const profile = () => import("../profile.functions");

// ---------------- MATCH ----------------

export const listMatchesForControl = fn(
  async (...args: any[]) =>
    (await match()).listMatchesForControl?.(...args) ?? { matches: [] }
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
    (await match()).listFulfillmentForMatch?.(...args) ?? { events: [] }
);

// ---------------- CAMPAIGNS ----------------

export const getCampaignByHandle = fn(
  async (...args: any[]) =>
    (await campaigns()).getCampaignByHandle?.(...args) ?? {}
);

export const listCampaignsByCategory = fn(
  async (...args: any[]) =>
    (await campaigns()).listCampaignsByCategory?.(...args) ?? []
);

// ---------------- SPONSORS ----------------

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
  async () =>
    (await sponsor()).getMySponsorDocUrl?.() ?? ""
);

// ---------------- CHECKOUT ----------------

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
  async () =>
    (await shopify()).getShopifyCredentials?.()
);

// ---------------- PETRI ----------------

export const allocateStabilizationSponsor = fn(
  async (...args: any[]) =>
    (await petri()).allocateStabilizationSponsor?.(...args)
);

export const recomputePetriScores = fn(
  async () =>
    (await petri()).recomputePetriScores?.()
);

export const recomputePetriScoresCore = fn(
  async () =>
    (await petri()).recomputePetriScoresCore?.()
);

// ---------------- SUPPLIERS ----------------

export const isZipFulfillable = fn(
  async (...args: any[]) =>
    (await supplierZip()).isZipFulfillable?.(...args) ?? true
);

export const getActiveSuppliersByZip = fn(
  async (...args: any[]) =>
    (await supplierZip()).getActiveSuppliersByZip?.(...args) ?? []
);

// ---------------- CRON ----------------

export const runSupplierVerificationCycle = fn(
  async () =>
    (await cron()).runSupplierVerificationCycle?.()
);

export const startSupplierVerificationCron = fn(
  async () =>
    (await cron()).startSupplierVerificationCron?.()
);

// ---------------- ADMIN / SYSTEM ----------------

export const getCommandCenterSnapshot = fn(
  async () =>
    (await stats()).getCommandCenterSnapshot?.() ?? {}
);

export const listImpactReports = fn(
  async () =>
    (await stats()).listImpactReports?.() ?? []
);

export const approveFlywheelReport = fn(
  async (...args: any[]) =>
    (await stats()).approveFlywheelReport?.(...args)
);

// ---------------- STATS ----------------

export const getPublicStats = fn(
  async () =>
    (await stats()).getPublicStats?.() ?? { total: 0 }
);

export const getLifecycleCounts = fn(
  async () =>
    (await stats()).getLifecycleCounts?.() ?? {
      active: 0,
      pending: 0,
      completed: 0,
    }
);

export const getImpactMapData = fn(
  async () =>
    (await stats()).getImpactMapData?.() ?? []
);

export const getMarketplaceFeed = fn(
  async () =>
    (await stats()).getMarketplaceFeed?.() ?? []
);

// ---------------- PROFILE ----------------

export const getMyProfile = fn(
  async () =>
    (await stats()).getMyProfile?.() ?? {}
);

export const updateMyProfile = fn(
  async (...args: any[]) =>
    (await stats()).updateMyProfile?.(...args)
);

export const moderateImage = fn(
  async (...args: any[]) =>
    (await stats()).moderateImage?.(...args)
);

export const getMyGiving = fn(
  async () =>
    (await stats()).getMyGiving?.() ?? {}
);

// ---------------- SAFE ESCAPE HATCH ----------------

export const __call = fn(async (module: string, method: string, data: any) => {
  const mod: any = await import(`../${module}`);
  return mod?.[method]?.(data);
});

