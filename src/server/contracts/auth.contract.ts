import { createServerFn } from "@tanstack/react-start";

const fn = createServerFn().handler;

export const login = fn(async (data: any) => data);
export const logout = fn(async () => true);
export const resetPassword = fn(async (email: string) => true);
