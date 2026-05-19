export async function getFulfillmentStatus(zip: string) {
  const accommodation = await supabase
    .from("housing_partners")
    .select("*")
    .eq("zip", zip)
    .maybeSingle();

  const food = await supabase
    .from("food_partners")
    .select("*")
    .eq("zip", zip)
    .maybeSingle();

  const transport = await supabase
    .from("transport_partners")
    .select("*")
    .eq("zip", zip)
    .maybeSingle();

  return {
    zip_code: zip,
    has_accommodation: !!accommodation.data,
    has_food_supplier: !!food.data,
    has_transport_support: !!transport.data,
    is_fulfillable:
      !!accommodation.data && !!food.data && !!transport.data,
  };
}
