export type SponsorshipVeteranPackage = {
  id: string;

  title: string;
  price: number;
  currency: "USD";

  duration_days: 7;

  includes: {
    accommodation: {
      nights: 7; // hard cap
    };

    meals: {
      per_day: 3;
      type: "vegan-vegetarian";
    };

    access: {
      counseling_invites: boolean;
      workshops_invites: boolean;
      mentorship_invites: boolean;
    };
  };

  system: {
    petri_matching: true;
    human_first_allocation: true;
  };

  continuation_paths: string[];

  status: "active" | "paused";
};
