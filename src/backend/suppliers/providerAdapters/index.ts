import { bookingAdapter } from "./booking.adapter";
import { airbnbAdapter } from "./airbnb.adapter";
import { manualAdapter } from "./manual.adapter";
import type { SupplierProviderAdapter } from "./types";

export const providerAdapters: SupplierProviderAdapter[] = [
  manualAdapter,
  bookingAdapter,
  airbnbAdapter,
];

export type { SupplierProviderAdapter, NormalizedSupplierRecord } from "./types";
