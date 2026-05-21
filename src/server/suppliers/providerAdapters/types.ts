export type NormalizedSupplierRecord = {
  supplierId: string;
  zip: string;
  available_rooms: number;
  nightly_rate_usd: number;
  active: boolean;
};

export interface SupplierProviderAdapter {
  readonly provider: "booking" | "airbnb" | "manual";
  syncSupplierAvailability(): Promise<NormalizedSupplierRecord[]>;
}