export type PersonStatus =
  | "pending"
  | "verified"
  | "active"
  | "supported"
  | "completed";

export type Person = {
  id: string;

  display_name: string;
  story?: string | null;

  location?: string | null;

  status: PersonStatus;

  verification_partner_id?: string | null;

  created_at?: string;
  updated_at?: string;
};
