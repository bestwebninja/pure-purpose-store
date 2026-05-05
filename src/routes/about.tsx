import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MyBlessings" },
      { name: "description", content: "MyBlessings is a giving-first platform built so generosity can move quickly and clearly." },
      { property: "og:title", content: "About — MyBlessings" },
      { property: "og:description", content: "A giving-first platform built so generosity can move quickly and clearly." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-display text-4xl font-semibold md:text-6xl">About MyBlessings</h1>
      <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          MyBlessings exists for a single reason: to make generosity simple, transparent, and human.
          We believe that when humanity shows up for one another, blessings happen.
        </p>
        <p>
          We're not an ecommerce store. We're not a marketplace. Every blessing on this platform is
          a real moment in a real person's life, and every dollar given is accounted for in public.
        </p>
        <p>
          Our team has worked across nonprofit technology, fintech, and community organizing. We
          built MyBlessings because we wanted a giving experience that felt as good as it does to
          give in person — but reached further.
        </p>
      </div>
    </div>
  );
}