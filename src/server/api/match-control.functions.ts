import { createServerFn } from "@tanstack/react-start";

// ============================
// LIST MATCHES
// ============================
export const listMatchesForControl = createServerFn().handler(async () => {
  // TODO: Replace with real DB query (Supabase / Prisma / etc.)
  return {
    matches: [],
  };
});

// ============================
// APPROVE MATCH
// ============================
export const approveMatch = createServerFn().handler(async ({ data }: any) => {
  const { id } = data;

  // TODO: DB update + business logic
  return {
    ok: true,
    action: "approved",
    id,
  };
});

// ============================
// REJECT MATCH
// ============================
export const rejectMatch = createServerFn().handler(async ({ data }: any) => {
  const { id } = data;

  // TODO: DB update + audit log
  return {
    ok: true,
    action: "rejected",
    id,
  };
});

// ============================
// EXECUTE MATCH
// ============================
export const executeMatch = createServerFn().handler(async ({ data }: any) => {
  const { id } = data;

  // TODO: trigger fulfillment pipeline
  return {
    ok: true,
    action: "executed",
    id,
  };
});

// ============================
// LIST FULFILLMENT EVENTS
// ============================
export const listFulfillmentForMatch = createServerFn().handler(
  async ({ data }: any) => {
    const { id } = data;

    // TODO: fetch from fulfillment logs table
    return {
      matchId: id,
      events: [],
    };
  }
);
