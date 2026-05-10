import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AnswerSchema = z.object({
  questionId: z.string(),
  prompt: z.string(),
  value: z.string(),
});

const InputSchema = z.object({
  answers: z.array(AnswerSchema).min(1).max(40),
  distress: z.enum(["calm", "tender", "urgent", "crisis"]),
  step: z.number().int().min(0).max(40),
});

export type NextQuestion = {
  done: boolean;
  prompt: string;
  whisper?: string;
  kind: "text" | "longtext" | "choice";
  choices?: { value: string; label: string }[];
  summary?: string;
};

export const generateNextQuestion = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<NextQuestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    // Stop after roughly 7 total questions, sooner in crisis.
    const maxSteps = data.distress === "crisis" ? 5 : 7;
    if (data.step >= maxSteps) {
      return {
        done: true,
        prompt: "Thank you for trusting us with this.",
        whisper: "We're matching you with the right hands now.",
        kind: "text",
        summary: synthesize(data.answers),
      };
    }

    const transcript = data.answers
      .map((a) => `Q: ${a.prompt}\nA: ${a.value}`)
      .join("\n\n");

    const system = `You are PETRI, a gentle, art-school-warm intake guide for MyBlessings — a kindness coordination network. You ask ONE question at a time. Your tone matches distress level: ${data.distress}. Crisis = direct, short, action-oriented. Tender/calm = poetic, slow, reflective. Never moralize. Never give advice. Only ask the next most useful question to understand what real-world help (food, transport, shelter, care) the person needs. Respond ONLY as JSON: {"prompt": string, "whisper"?: string, "kind": "text"|"longtext"|"choice", "choices"?: [{"value":string,"label":string}]}.`;

    if (!apiKey) {
      // Graceful fallback if Lovable AI is unavailable.
      return fallbackQuestion(data.step);
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Conversation so far:\n\n${transcript}\n\nGive me the next question.` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return fallbackQuestion(data.step);
      const json = await res.json() as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      return {
        done: false,
        prompt: String(parsed.prompt ?? "Tell me a little more."),
        whisper: parsed.whisper ? String(parsed.whisper) : undefined,
        kind: (["text", "longtext", "choice"].includes(parsed.kind) ? parsed.kind : "longtext") as NextQuestion["kind"],
        choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 5).map((c: { value?: unknown; label?: unknown }) => ({
          value: String(c.value ?? ""),
          label: String(c.label ?? ""),
        })) : undefined,
      };
    } catch {
      return fallbackQuestion(data.step);
    }
  });

function fallbackQuestion(step: number): NextQuestion {
  const seq: NextQuestion[] = [
    { done: false, prompt: "What kind of help would change today the most?", kind: "longtext", whisper: "Name it however it comes." },
    { done: false, prompt: "Where are you, roughly? (city is enough)", kind: "text" },
    { done: false, prompt: "Is there a budget or amount you can't go above?", kind: "text", whisper: "It's okay if the answer is none." },
    { done: false, prompt: "Anything else we should know to walk with you well?", kind: "longtext" },
  ];
  return seq[Math.min(step - 3, seq.length - 1)] ?? seq[seq.length - 1];
}

function synthesize(answers: { prompt: string; value: string }[]): string {
  return answers.map((a) => `${a.prompt} — ${a.value}`).join(" | ");
}