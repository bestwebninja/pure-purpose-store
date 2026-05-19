type FulfillmentCheck = {
  zip_code: string;
  has_accommodation: boolean;
  has_food_supplier: boolean;
  has_transport_support: boolean;
  is_fulfillable: boolean;
};

export function isPackageSellable(check: FulfillmentCheck) {
  return (
    check.has_accommodation &&
    check.has_food_supplier &&
    check.has_transport_support
  );
}
