import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — MyBlessings" },
      { name: "description", content: "Sign in to your MyBlessings dashboard to manage your giving." },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
        <Heart className="h-5 w-5" fill="currentColor" />
      </span>
      <h1 className="text-display mt-6 text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Sign in to view your giving history and manage your blessings.
      </p>
      <Card className="mt-8 w-full space-y-3 p-6 shadow-card">
        <Button className="w-full" disabled>Continue with Google</Button>
        <Button variant="outline" className="w-full" disabled>Continue with email</Button>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Account login is coming soon.
        </p>
      </Card>
    </div>
  );
}