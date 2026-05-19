export type AccommodationSupplier = {
  id: string;

  name: string;

  type: "hotel" | "guesthouse" | "hostel" | "airbnb_host" | "private_landlord";

  location: {
    country: string;
    city: string;
    zip: string;
  };

  capacity: {
    total_rooms: number;
    available_rooms: number;
  };

  pricing: {
    base_nightly_rate_usd: number;

    // system-controlled override (Petri pricing engine)
    adjusted_nightly_rate_usd?: number;
  };

  rules: {
    vegan_meal_available: boolean;
    vegetarian_meal_available: boolean;
  };

  verification: {
    status: "pending" | "verified" | "rejected";
    trust_score: number; // 0–100
  };

  integration: {
    booking_api_connected: boolean;
    airbnb_sync_enabled: boolean;
  };

  active: boolean;
};
