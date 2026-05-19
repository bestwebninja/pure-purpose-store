export type BlessingStatus =
  | "draft"
  | "active"
  | "matched"
  | "funded"
  | "completed";

export type Blessing = {
  id: string;

  person_id: string;

  title: string;
  story?: string | null;

  category?: string | null;

  goal_amount: number;
  raised_amount: number;

  currency: string;

  status: BlessingStatus;

  created_at?: string;
  updated_at?: string;
};
