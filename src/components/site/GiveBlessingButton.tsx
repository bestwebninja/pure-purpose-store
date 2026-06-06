import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = { className?: string; size?: "sm" | "default" | "lg" };

export function GiveBlessingButton({ className = "", size = "default" }: Props) {
  return (
    <Button
      asChild
      size={size}
      className={`font-blessing text-base sm:text-xl px-3 sm:px-5 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary-glow shadow-blessing-glow ${className}`}
    >
      <Link to="/give-a-blessing">
        <span className="hidden sm:inline">Give a Blessing {"\u{1F64F}"}</span>
        <span className="sm:hidden">Give {"\u{1F64F}"}</span>
      </Link>
    </Button>
  );
}
