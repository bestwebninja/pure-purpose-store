import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full shadow-soft" style={{ background: "linear-gradient(135deg, #ff6f91 0%, #ff3d6e 50%, #e11d48 100%)" }}>
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </span>
            <span className="text-display text-lg font-semibold">MyBlessings</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            When humanity shows up for one another, blessings happen. A transparent giving
            platform connecting generous people with real causes.
          </p>
        </div>
        <div>
          <h4 className="text-display text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
            <li><Link to="/transparency" className="hover:text-foreground">Transparency</Link></li>
            <li><Link to="/give" className="hover:text-foreground">Give a Blessing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-display text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MyBlessings.US — every blessing matters.
      </div>
    </footer>
  );
}