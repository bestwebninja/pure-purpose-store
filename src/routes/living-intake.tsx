import { createFileRoute } from "@tanstack/react-router";
import { LivingIntake } from "@/components/petri/LivingIntake";

export const Route = createFileRoute("/living-intake")({
  head: () => ({
    meta: [
      { title: "Tell us what's happening — MyBlessings" },
      { name: "description", content: "A gentle, one-question-at-a-time intake. Share what you need and we'll connect you with real-world help." },
      { property: "og:title", content: "MyBlessings — Living Intake" },
      { property: "og:description", content: "One question at a time. We listen first." },
    ],
  }),
  component: LivingIntake,
});