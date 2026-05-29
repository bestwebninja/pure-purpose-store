import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import sunflowerField from "@/assets/sunflower-field.jpg";

export function SiteFooter() {
  return (
    <footer
      className="relative mt-24 overflow-hidden border-t border-border/60 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(8,28,80,0.55), rgba(8,28,80,0.7)), url(${sunflowerField})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Main footer grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-full shadow-soft"
              style={{
                background:
                  "linear-gradient(135deg, #ff6f91 0%, #ff3d6e 50%, #e11d48 100%)",
              }}
            >
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </span>

            <span className="text-display text-lg font-semibold">
              MyBlessings
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm text-white/75">
            When humanity shows up for one another, blessings happen. A
            transparent giving platform connecting generous people with real
            causes.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-display text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link to="/how-it-works" className="hover:text-white">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/transparency" className="hover:text-white">
                Transparency
              </Link>
            </li>
            <li>
              <Link to="/give" className="hover:text-white">
                Give a Blessing
              </Link>
            </li>
            <li>
              <Link
                to="/corporate-signup"
                className="text-sm text-white/70 hover:text-white underline"
              >
                Corporate Sponsors
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-display text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link to="/about-myblessings" className="hover:text-white">
                About MyBlessings
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/15 py-6 text-center text-xs text-white/70">
        © {new Date().getFullYear()} MyBlessings.US (Every blessing matters)
      </div>
    </footer>
  );
}
