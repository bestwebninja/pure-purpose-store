// src/server/api/gateway/index.ts

import { registry as gatewayRegistry } from "./registry";

// Sponsor module
import * as sponsor from "./sponsor.gateway";

// Future modules (you will add these next)
import * as blessing from "./blessing.gateway";
import * as petri from "./petri.gateway";

// Register all modules
// (registry is a static contract; modules are wired in directly below)

// ================================
// UNIFIED GATEWAY EXPORT LAYER
// ================================

export const gateway = {
  sponsor,
  blessing,
  petri,
};

export { gatewayRegistry };