// PETRI Question Engine — hybrid: deterministic opening + AI-driven deepening.
// The static tree handles the first 3 emotional grounding questions, then the
// adaptive AI generator (intake-ai.functions) takes over.

export type IntakeAnswer = {
  questionId: string;
  prompt: string;
  value: string;
  at: number;
};

export type IntakeQuestion = {
  id: string;
  whisper?: string;
  prompt: string;
  kind: "text" | "longtext" | "choice";
  choices?: { value: string; label: string }[];
  // optional minimum dwell so the experience feels slow & considered
  minDwellMs?: number;
};

export const OPENING_QUESTIONS: IntakeQuestion[] = [
  {
    id: "presence",
    whisper: "Take a breath. We're here.",
    prompt: "What's happening for you right now?",
    kind: "longtext",
    minDwellMs: 1500,
  },
  {
    id: "urgency",
    whisper: "However it lands is okay.",
    prompt: "How heavy does this feel today?",
    kind: "choice",
    choices: [
      { value: "crisis", label: "I need help tonight" },
      { value: "soon", label: "Within a few days" },
      { value: "weeks", label: "It's been building for weeks" },
      { value: "exploring", label: "Just exploring for now" },
    ],
  },
  {
    id: "subject",
    whisper: "Who are we walking with?",
    prompt: "Is this for you, or for someone you love?",
    kind: "choice",
    choices: [
      { value: "self", label: "For me" },
      { value: "family", label: "For my family" },
      { value: "other", label: "For someone else" },
    ],
  },
];

const DISTRESS_KEYWORDS = [
  "tonight", "no food", "hungry", "evict", "homeless", "sleeping in",
  "scared", "afraid", "suicid", "abuse", "hit me", "no money",
  "can't afford", "shut off", "shut-off", "cut off", "emergency",
  "hospital", "dying", "alone", "lost everything",
];

export type DistressLevel = "calm" | "tender" | "urgent" | "crisis";

export function detectDistress(answers: IntakeAnswer[]): DistressLevel {
  const text = answers.map((a) => a.value.toLowerCase()).join(" ");
  const hits = DISTRESS_KEYWORDS.filter((k) => text.includes(k)).length;
  const urgency = answers.find((a) => a.questionId === "urgency")?.value;
  if (urgency === "crisis" || hits >= 3) return "crisis";
  if (urgency === "soon" || hits >= 1) return "urgent";
  if (urgency === "weeks") return "tender";
  return "calm";
}

export function pacingForDistress(level: DistressLevel): number {
  // crisis flows faster; calm flows slower (more reflective)
  switch (level) {
    case "crisis": return 400;
    case "urgent": return 800;
    case "tender": return 1400;
    default: return 2000;
  }
}