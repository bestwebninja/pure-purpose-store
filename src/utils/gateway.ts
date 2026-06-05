// src/utils/gateway.ts

// Dynamic compilation typing extraction container
type GatewayModule = typeof import("@/lib/gateway");
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

// Extract specific object type architectures directly from the Gateway function returns
type CampaignsByCategoryFn = GatewayModule["listCampaignsByCategory"];
type CampaignsByCategoryResponse = UnpackPromise<ReturnType<CampaignsByCategoryFn>>;
export type CampaignCategory = CampaignsByCategoryResponse["campaigns"][number];

type CampaignByHandleFn = GatewayModule["getCampaignByHandle"];
type CampaignByHandleResponse = UnpackPromise<ReturnType<CampaignByHandleFn>>;
export type Campaign = NonNullable<CampaignByHandleResponse["campaign"]>;
export type Donation = NonNullable<CampaignByHandleResponse["donations"]>[number];