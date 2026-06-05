// Real Gateway binding for the match-control admin surface.
// Re-exports the auth-protected createServerFn implementations from
// `@/backend/match-control.functions` (Supabase-backed approve/reject/execute
// and fulfillment-event reads).
export {
  listMatchesForControl,
  approveMatch,
  rejectMatch,
  executeMatch,
  listFulfillmentForMatch,
} from "@/backend/match-control.functions";
