import { createServerFn } from "@tanstack/react-start";

const fn = createServerFn().handler;

export const createCheckout = fn(async (data: any) => data);
export const verifyCheckout = fn(async (data: any) => true);
