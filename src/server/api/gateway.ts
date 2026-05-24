// src/server/api/gateway.ts
// ===============================
// MyBlessings Gateway OS Router
// Single Source of Truth API Layer
// ===============================

import * as sponsor from "@/server/api/sponsor.functions";

// ===============================
// FUNCTION REGISTRY
// ===============================

export const Gateway = {
  // Sponsor Domain
  createSponsorProfile: sponsor.createSponsorProfile,
  getMySponsorProfile: sponsor.getMySponsorProfile,
  listSponsors: sponsor.listSponsors,
  updateSponsorStatus: sponsor.updateSponsorStatus,
};

// ===============================
// FLAT EXPORT LAYER (CRITICAL)
// ===============================
// This fixes ALL your current import errors in UI

export const createSponsorProfile = sponsor.createSponsorProfile;
export const getMySponsorProfile = sponsor.getMySponsorProfile;
export const listSponsors = sponsor.listSponsors;
export const updateSponsorStatus = sponsor.updateSponsorStatus;

// ===============================
// TYPE SAFE GATEWAY CONTRACT
// ===============================

export type GatewayType = typeof Gateway;