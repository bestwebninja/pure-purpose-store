// Real Gateway binding for lifecycle metrics (admin/marketplace/impact).
// Re-exports the createServerFn implementations from lifecycle.server.ts so
// the gateway façade can wire UI consumers without importing a `.server.ts`
// file directly (which the client import-protection plugin blocks).
export {
  getLifecycleCounts,
  getMarketplaceFeed,
  getImpactMapData,
  type LifecycleCounts,
} from "@/backend/lifecycle.functions";
