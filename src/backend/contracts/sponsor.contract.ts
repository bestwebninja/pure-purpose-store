import { createServerFn } from "@tanstack/react-start";

const fn = createServerFn().handler;

export const listSponsors = fn(async () => []);
export const updateSponsor = fn(async (data: any) => data);
