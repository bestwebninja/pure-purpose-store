// src/server/api/gateway.ts
// =============================================================================
// Gateway OS — Stable public API surface.
//
// Every export below resolves to a REAL implementation:
//   * createServerFn handlers in src/server/api/*.functions.ts (RPC over HTTP)
//   * server-fn re-exports from src/server/*.functions.server.ts
//
// This file is imported by client UI components (for `cn` and for the
// server-fn RPC stubs), so it MUST NOT import any `*.server.ts` module at
// top level — the client import-protection plugin blocks that. All server
// helpers we expose here are wrapped by a `.functions.ts` file that the
// TanStack server-fn Vite plugin transforms into client-safe RPC stubs.
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ──────────────────────── Types ─────────────────────────────────────────────
export type { Campaign } from "@/server/api/campaigns.functions";
export type { LifecycleCounts } from "@/server/api/lifecycle.functions";

// ──────────────────────── Sponsor ───────────────────────────────────────────
export {
  createSponsorProfile,
  getMySponsorProfile,
  listSponsors,
  updateSponsorStatus,
} from "@/server/api/sponsor.functions";
export { getSponsorRecommendations } from "@/server/api/sponsor-decision.functions";
export { listSponsorInvoices } from "@/server/api/invoicing.functions";
export {
  updateSponsorAssets,
  getMySponsorDocUrl,
} from "@/server/api/sponsor-uploads.functions";
export { moderateImage } from "@/server/api/moderation.functions";

// ──────────────────────── Checkout ──────────────────────────────────────────
export {
  createBlessingCheckout,
  createFundingPackageCheckout,
} from "@/server/api/checkout.functions";

// ──────────────────────── Petri OS ──────────────────────────────────────────
export { recomputePetriScores } from "@/server/api/petri-recompute.functions";

// ──────────────────────── NGO Lifecycle ─────────────────────────────────────
export {
  submitNgoApplication,
  listNgoApplications,
  updateNgoStatus,
  checkIsAdmin,
  listCategories,
  getCommandCenterSnapshot,
} from "@/server/api/ngo.functions";

// ──────────────────────── Profile / Giving ─────────────────────────────────
export { getMyProfile, updateMyProfile } from "@/server/api/profile.functions";
export { getMyGiving } from "@/server/api/giving.functions";

// ──────────────────────── Stats ────────────────────────────────────────────
export { getPublicStats } from "@/server/api/stats.functions";

// ──────────────────────── Corporate Sponsors ───────────────────────────────
export {
  submitCorporateApplication,
  listCorporateSponsors,
} from "@/server/api/corporate.functions";

// ──────────────────────── Marketplace / Impact / Lifecycle ─────────────────
export {
  getLifecycleCounts,
  getMarketplaceFeed,
  getImpactMapData,
} from "@/server/api/lifecycle.functions";

// ──────────────────────── Finance / Flywheel ───────────────────────────────
export {
  listImpactReports,
  approveFlywheelReport,
} from "@/server/api/flywheel.functions";

// ──────────────────────── Match Control ────────────────────────────────────
export {
  listMatchesForControl,
  approveMatch,
  rejectMatch,
  executeMatch,
  listFulfillmentForMatch,
} from "@/server/api/match-control.functions";

// ──────────────────────── Campaigns / Categories ───────────────────────────
export {
  listCampaignsByCategory,
  getCampaignByHandle,
} from "@/server/api/campaigns.functions";

// ──────────────────────── Gateway shim (for legacy `gateway.sponsor.*`) ────
import { listSponsors as _listSponsors } from "@/server/api/sponsor.functions";
export const Gateway = {
  sponsor: {
    listSponsors: _listSponsors,
  },
} as const;
export const gateway = Gateway;
export type GatewayType = typeof Gateway;

// ──────────────────────── UI utility ───────────────────────────────────────
// Kept in this module because the UI kit already imports `cn` from
// "@/server/api/gateway" across ~30 shadcn components. Pure client-safe code.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
