// src/utils/api.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type GatewayModule = typeof import("../server/api/gateway");
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

// 1. Dynamic Categories Extractions
type CategoriesFn = GatewayModule["listCategories"];
export type CategoriesResponse = UnpackPromise<ReturnType<CategoriesFn>>;

// 2. Dynamic Category Items Extractions
type CampaignsByCategoryFn = GatewayModule["listCampaignsByCategory"];
type CampaignsByCategoryResponse = UnpackPromise<ReturnType<CampaignsByCategoryFn>>;
export type CampaignCategory = CampaignsByCategoryResponse["campaigns"][number];

// 3. Dynamic Campaign Detail Extractions
type CampaignByHandleFn = GatewayModule["getCampaignByHandle"];
type CampaignByHandleResponse = UnpackPromise<ReturnType<CampaignByHandleFn>>;
export type Campaign = NonNullable<CampaignByHandleResponse["campaign"]>;
export type Donation = NonNullable<CampaignByHandleResponse["donations"]>[number];

/**
 * FIXED EXPORT LAYER FOR THE UI KIT
 * Safely unifies classnames on the client side, decoupled from the server path.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}