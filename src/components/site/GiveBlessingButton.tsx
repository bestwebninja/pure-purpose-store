import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = { className?: string; size?: "sm" | "default" | "lg" };

export function GiveBlessingButton({ className = "", size = "default" }: Props) {
  return (
    <Button
      asChild
      size={size}
      className={`text-xl hover:opacity-95 ${className}`}
      style={{
        backgroundColor: "#1d4ed8",
        color: "#f8f6ee",
        fontFamily: '"Great Vibes", "Snell Roundhand", cursive',
        boxShadow:
          "0 0 20px 4px rgba(125, 200, 255, 0.85), 0 0 44px 10px rgba(255, 230, 120, 0.6), 0 0 72px 14px rgba(255, 215, 0, 0.35)",
      }}
    >
      <Link to="/give-a-blessing">Give a Blessing 🙏</Link>
    </Button>
  );
}
