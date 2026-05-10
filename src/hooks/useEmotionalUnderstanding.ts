import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  OPENING_QUESTIONS,
  detectDistress,
  pacingForDistress,
  type IntakeAnswer,
  type IntakeQuestion,
  type DistressLevel,
} from "@/lib/petri-question-engine";
import { generateNextQuestion, type NextQuestion } from "@/lib/intake-ai.functions";

type Phase = "asking" | "thinking" | "complete";

export function useEmotionalUnderstanding() {
  const askAi = useServerFn(generateNextQuestion);
  const [answers, setAnswers] = useState<IntakeAnswer[]>([]);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("asking");
  const [adaptive, setAdaptive] = useState<NextQuestion | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const distress: DistressLevel = useMemo(() => detectDistress(answers), [answers]);
  const pacing = pacingForDistress(distress);

  const current: IntakeQuestion | null = useMemo(() => {
    if (phase === "complete") return null;
    if (step < OPENING_QUESTIONS.length) return OPENING_QUESTIONS[step];
    if (adaptive && !adaptive.done) {
      return {
        id: `adaptive-${step}`,
        prompt: adaptive.prompt,
        whisper: adaptive.whisper,
        kind: adaptive.kind,
        choices: adaptive.choices,
      };
    }
    return null;
  }, [phase, step, adaptive]);

  const submit = useCallback(
    async (value: string) => {
      if (!current) return;
      const next: IntakeAnswer = {
        questionId: current.id,
        prompt: current.prompt,
        value,
        at: Date.now(),
      };
      const nextAnswers = [...answers, next];
      setAnswers(nextAnswers);
      setPhase("thinking");
      // gentle pause so it feels considered, not transactional
      await new Promise((r) => setTimeout(r, pacing));

      const newStep = step + 1;
      if (newStep < OPENING_QUESTIONS.length) {
        setStep(newStep);
        setAdaptive(null);
        setPhase("asking");
        return;
      }

      try {
        const ai = await askAi({
          data: {
            answers: nextAnswers.map(({ questionId, prompt, value }) => ({ questionId, prompt, value })),
            distress: detectDistress(nextAnswers),
            step: newStep,
          },
        });
        if (ai.done) {
          setSummary(ai.summary ?? null);
          setPhase("complete");
        } else {
          setAdaptive(ai);
          setStep(newStep);
          setPhase("asking");
        }
      } catch {
        setPhase("complete");
      }
    },
    [askAi, answers, current, pacing, step],
  );

  return {
    current,
    phase,
    step,
    answers,
    distress,
    summary,
    submit,
    totalEstimate: Math.max(7, step + 2),
  };
}