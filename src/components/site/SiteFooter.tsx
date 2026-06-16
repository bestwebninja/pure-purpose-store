import { Link } from "@tanstack/react-router";
import sunflowerField from "@/assets/sunflower-field.jpg";

export function SiteFooter() {
  return (
    <footer className="site-footer-sunflower relative mt-24 overflow-hidden border-t border-border/60 text-foreground">
      <img src={sunflowerField} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgba(8,28,80,0.7)]" />
      {/* Main footer grid */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-display text-lg font-semibold">
              MyBlessings
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            When humanity shows up for one another, blessings happen. A
            transparent giving platform connecting generous people with real
            causes.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-display text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/how-it-works" className="hover:text-foreground">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/transparency" className="hover:text-foreground">
                Transparency
              </Link>
            </li>
            <li>
              <Link to="/give-a-blessing" className="hover:text-foreground">
                Give a Blessing
              </Link>
            </li>
            <li>
              <Link
                to="/corporate-signup"
                className="hover:text-foreground"
              >
                Corporate Sponsors
              </Link>
            </li>
            <li>
              <Link
                to="/ngo"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                NGO Sign Up
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-display text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about-myblessings" className="hover:text-foreground">
                About MyBlessings
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="site-footer-safe-padding relative border-t border-border/15 px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MyBlessings.US (Every blessing matters)
      </div>
    </footer>
  );
}
