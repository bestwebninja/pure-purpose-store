import { createServerFn } from "@tanstack/react-start";

const fn = createServerFn().handler;

export const recomputePetri = fn(async () => ({ ok: true }));
export const allocateSponsor = fn(async (data: any) => data);
