import { useEffect, useState } from "react";

const QUOTES: { text: string; author: string }[] = [
  { text: "No one has ever become poor by giving.", author: "Anne Frank" },
  { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
  { text: "The meaning of life is to find your gift. The purpose of life is to give it away.", author: "Pablo Picasso" },
  { text: "Charity sees the need, not the cause.", author: "German Proverb" },
  { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain" },
  { text: "Do small things with great love.", author: "Mother Teresa" },
  { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { text: "Tzedakah and acts of kindness are the equivalent of all the mitzvot of the Torah.", author: "Talmud" },
  { text: "Whoever is kind to the poor lends to the Lord.", author: "Proverbs 19:17" },
];

const ROTATE_MS = 30 * 60 * 1000; // 30 minutes

export function InspirationQuote({ variant = "inline" }: { variant?: "inline" | "banner" }) {
  // Start at 0 on both SSR and client to avoid hydration mismatch, then rotate after mount.
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Pick a fresh starting quote post-hydration
    setIdx(Math.floor((Date.now() / ROTATE_MS) % QUOTES.length));
    const timer = window.setInterval(() => {
      setShow(false);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setShow(true);
      }, 700);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const q = QUOTES[idx];
  const base =
    "transition-opacity duration-700 ease-in-out " + (show ? "opacity-100" : "opacity-0");

  // Golden ivory color used for all quoted text across the app.
  const goldenIvory = "#F5E6A8";

  if (variant === "banner") {
    return (
      <div className={`${base} mx-auto max-w-3xl text-center`}>
        <p
          className="text-display text-xl italic md:text-2xl"
          style={{ color: goldenIvory, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        >
          "{q.text}"
        </p>
        <p className="mt-2 text-sm" style={{ color: goldenIvory, opacity: 0.85 }}>
          {q.author}
        </p>
      </div>
    );
  }
  return (
    <p className={`${base} text-xs italic`} style={{ color: goldenIvory }}>
      "{q.text}" <span style={{ opacity: 0.8 }}>{q.author}</span>
    </p>
  );
}
