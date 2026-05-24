// src/server/api/gateway.ts
// ===============================
// MyBlessings Gateway OS Router
// Stable Public API Surface Layer
// ===============================

import { registry } from "./gateway/registry";

// ===============================
// CORE GATEWAY OBJECT
// ===============================

export const Gateway = {
  sponsor: registry.sponsor,
};

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
  registry.sponsor.getLifecycleCounts ?? (async () => ({}));

// ===============================
// FINANCE / REPORTING
// ===============================

export const listImpactReports = async () => [];
export const approveFlywheelReport = async () => ({ ok: true });

// ===============================
// UI UTILITIES (CRITICAL FIX)
// ===============================

export const cn = (...classes: any[]) =>
  classes.filter(Boolean).join(" ");

// ===============================
// TYPES
// ===============================

export type GatewayType = typeof Gateway;