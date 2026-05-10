import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useEmotionalUnderstanding } from "@/hooks/useEmotionalUnderstanding";

export function LivingIntake() {
  const { current, phase, step, distress, summary, submit, totalEstimate } = useEmotionalUnderstanding();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft("");
    // small delay so the new question can fade in first
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [current?.id]);

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    await submit(trimmed);
  };

  return (
    <div className="petri-art">
      <div className="petri-canvas">
        <Progress step={step} total={totalEstimate} />

        {phase === "complete" && (
          <div>
            <div className="petri-whisper">Held.</div>
            <h1 className="petri-question">Thank you for trusting us with this.</h1>
            <p className="petri-meta">
              We're matching you with the right hands now. Someone will reach out soon.
              {distress === "crisis" && (
                <> If this is a life-threatening emergency, please call 911.</>
              )}
            </p>
            {summary && (
              <details className="petri-meta" style={{ marginTop: "1.5rem" }}>
                <summary style={{ cursor: "pointer" }}>What we heard</summary>
                <p style={{ marginTop: ".5rem", fontStyle: "italic" }}>{summary}</p>
              </details>
            )}
            <div style={{ marginTop: "2rem" }}>
              <Link to="/give" className="petri-cta" style={{ textDecoration: "none" }}>
                Explore active blessings →
              </Link>
            </div>
          </div>
        )}

        {phase !== "complete" && current && (
          <div key={current.id}>
            {current.whisper && <div className="petri-whisper">{current.whisper}</div>}
            <h1 className="petri-question">{current.prompt}</h1>

            <div style={{ marginTop: "2rem" }}>
              {current.kind === "choice" && current.choices ? (
                <div>
                  {current.choices.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className="petri-choice"
                      disabled={phase === "thinking"}
                      onClick={() => handleSubmit(c.label)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : current.kind === "longtext" ? (
                <>
                  <textarea
                    ref={(el) => { inputRef.current = el; }}
                    className="petri-textarea"
                    placeholder="Take your time…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={phase === "thinking"}
                  />
                  <ContinueButton
                    disabled={phase === "thinking" || !draft.trim()}
                    onClick={() => handleSubmit(draft)}
                    thinking={phase === "thinking"}
                  />
                </>
              ) : (
                <>
                  <input
                    ref={(el) => { inputRef.current = el; }}
                    className="petri-input"
                    placeholder="Type here…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(draft); }}
                    disabled={phase === "thinking"}
                  />
                  <ContinueButton
                    disabled={phase === "thinking" || !draft.trim()}
                    onClick={() => handleSubmit(draft)}
                    thinking={phase === "thinking"}
                  />
                </>
              )}
            </div>

            {distress === "crisis" && (
              <p className="petri-meta" style={{ marginTop: "2rem" }}>
                If you're in immediate danger, please call 911.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContinueButton({ disabled, onClick, thinking }: { disabled: boolean; onClick: () => void; thinking: boolean }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <button type="button" className="petri-cta" disabled={disabled} onClick={onClick}>
        {thinking ? "Listening…" : "Continue"}
      </button>
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  const cells = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="petri-progress" aria-hidden>
      {cells.map((i) => (
        <span key={i} className={i < step ? "active" : ""} />
      ))}
    </div>
  );
}