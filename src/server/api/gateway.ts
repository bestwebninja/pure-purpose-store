// src/server/api/gateway.ts
// ===============================
// MyBlessings Gateway OS Router
// Pure API Surface Layer (NO FUNCTION IMPORTS)
// ===============================

import { registry } from "./gateway/registry";

// ===============================
// FUNCTION REGISTRY
// ===============================

export const Gateway = {
  sponsor: registry.sponsor,
};

// ===============================
// FLAT EXPORT LAYER (CRITICAL)
// ===============================
// UI compatibility layer (safe re-exports)

export const {
  createSponsorProfile,
  getMySponsorProfile,
  listSponsors,
  updateSponsorStatus,
} = registry.sponsor;

// ===============================
// TYPE SAFE CONTRACT
// ===============================

export type GatewayType = typeof Gateway;