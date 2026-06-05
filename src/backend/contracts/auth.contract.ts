import { createServerFn } from "@tanstack/react-start";

export const login = createServerFn({ method: "POST" })
  .handler(async () => ({ ok: true }));
export const logout = createServerFn({ method: "POST" })
  .handler(async () => true);
export const resetPassword = createServerFn({ method: "POST" })
  .handler(async () => true);
