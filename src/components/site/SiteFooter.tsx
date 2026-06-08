import { Link } from "@tanstack/react-router";
import sunflowerField from "@/assets/sunflower-field.jpg";

export function SiteFooter() {
  return (
    <footer
      className="relative mt-24 overflow-hidden border-t border-border/60 text-primary-foreground"
      style={{
        backgroundImage: `linear-gradient(rgba(8,28,80,0.55), rgba(8,28,80,0.7)), url(${sunflowerField})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Main footer grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-display text-lg font-semibold">
              MyBlessings
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm text-primary-foreground/75">
            When humanity shows up for one another, blessings happen. A
            transparent giving platform connecting generous people with real
            causes.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-display text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li>
              <Link to="/how-it-works" className="hover:text-primary-foreground">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/transparency" className="hover:text-primary-foreground">
                Transparency
              </Link>
            </li>
            <li>
              <Link to="/give-a-blessing" className="hover:text-primary-foreground">
                Give a Blessing
              </Link>
            </li>
            <li>
              <Link
                to="/corporate-signup"
                className="hover:text-primary-foreground"
              >
                Corporate Sponsors
              </Link>
            </li>
            <li>
              <Link
                to="/ngo"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground underline"
              >
                NGO Sign Up
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-display text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li>
              <Link to="/about-myblessings" className="hover:text-primary-foreground">
                About MyBlessings
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-primary-foreground">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/15 px-4 py-6 text-center text-xs text-primary-foreground/70" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}>
        © {new Date().getFullYear()} MyBlessings.US (Every blessing matters)
      </div>
    </footer>
  );
}