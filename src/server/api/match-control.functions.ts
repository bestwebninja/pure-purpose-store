// Real Gateway binding for the match-control admin surface.
// Re-exports the auth-protected createServerFn implementations from
// `@/server/match-control.functions` (Supabase-backed approve/reject/execute
// and fulfillment-event reads).
export {
  listMatchesForControl,
  approveMatch,
  rejectMatch,
  executeMatch,
  listFulfillmentForMatch,
} from "@/server/match-control.functions";
