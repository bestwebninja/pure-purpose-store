// src/server/api/gateway/registry.ts

/**
 * STATIC GATEWAY CONTRACT ONLY
 * NO imports allowed (enforced by gateway OS rules)
 */

export const registry = {
  sponsor: {
    createSponsorProfile: "createSponsorProfile",
    getMySponsorProfile: "getMySponsorProfile",
    listSponsors: "listSponsors",
    updateSponsorStatus: "updateSponsorStatus",
  },
};

export type GatewayModule = Record<string, string>;