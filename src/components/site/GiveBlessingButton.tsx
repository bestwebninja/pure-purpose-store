import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = { className?: string; size?: "sm" | "default" | "lg" };

export function GiveBlessingButton({ className = "", size = "default" }: Props) {
  return (
    <Button
      asChild
      size={size}
      className={`font-blessing text-xl bg-primary text-primary-foreground hover:bg-primary-glow shadow-blessing-glow ${className}`}
    >
      <Link to="/give-a-blessing">
        Give a Blessing {"\u{1F64F}"}
      </Link>
    </Button>
  );
}
