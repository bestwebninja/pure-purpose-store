export type PetriToken =
  | "blessee_sentiment"
  | "donor_allocation"
  | "housing_capacity"
  | "nutrition_capacity"
  | "care_capacity";

export type PetriNode =
  | "input"
  | "transition"
  | "verification"
  | "stabilization";

export type PetriEdge = {
  from: PetriNode;
  to: PetriNode;
  weight: number;
};

export type PetriState = {
  nodes: PetriNode[];
  edges: PetriEdge[];
  stability_score: number;
};
