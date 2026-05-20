import { supabase } from "@/integrations/supabase/client";

export async function getFulfillmentStatus(zip: string) {
  const accommodation = await supabase
    .from("accommodation_suppliers" as any)
    .select("*")
    .eq("zip", zip)
    .maybeSingle();

  const food = await supabase
    .from("accommodation_suppliers" as any)
    .select("*")
    .eq("zip", zip)
    .eq("vegan_meal_available", true)
    .maybeSingle();

  const transport = await supabase
    .from("accommodation_suppliers" as any)
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
