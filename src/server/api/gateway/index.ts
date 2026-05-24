// src/server/api/gateway/index.ts

import { gatewayRegistry } from "./registry";

// Sponsor module
import * as sponsor from "./sponsor.gateway";

// Future modules (you will add these next)
import * as blessing from "./blessing.gateway";
import * as petri from "./petri.gateway";

// Register all modules
gatewayRegistry.register("sponsor", sponsor);
gatewayRegistry.register("blessing", blessing);
gatewayRegistry.register("petri", petri);

// ================================
// UNIFIED GATEWAY EXPORT LAYER
// ================================

export const gateway = {
  sponsor,
  blessing,
  petri,
};

export { gatewayRegistry };