// NGO server-fn stubs (placeholder).
import { createServerFn } from "@tanstack/react-start";

export const listNgoApplications = createServerFn({ method: "GET" })
  .handler(async () => ({ applications: [] as any[] }));

export const updateNgoStatus = createServerFn({ method: "POST" })
  .handler(async () => ({ ok: true }));

export const submitNgoApplication = createServerFn({ method: "POST" })
  .handler(async () => ({ ok: true }));
