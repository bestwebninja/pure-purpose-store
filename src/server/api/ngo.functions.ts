// Real Gateway binding for NGO admin + onboarding.
// Re-exports the actual createServerFn implementations defined in
// `@/server/ngo.functions.server` (ProPublica vetting matrix, AI intelligence
// score, admin role guard, command-center snapshot, categories).
export {
  submitNgoApplication,
  listNgoApplications,
  updateNgoStatus,
  checkIsAdmin,
  listCategories,
  getCommandCenterSnapshot,
} from "@/server/ngo.functions.server";
