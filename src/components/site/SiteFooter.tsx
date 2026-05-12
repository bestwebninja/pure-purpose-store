import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { InspirationQuote } from "@/components/site/InspirationQuote";
import { useEffect, useState } from "react";

// Curated, license-friendly nature imagery (Unsplash CDN — free to use).
const FOOTER_IMAGES = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=70", // sunflower field
  "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?auto=format&fit=crop&w=1920&q=70", // sunflower close
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=70", // green landscape
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=70", // misty hills
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=70", // wildflowers
];

export function SiteFooter() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FOOTER_IMAGES.length), 7000);
    return () => clearInterval(t);
  }, []);
  return (
    <footer
      className="relative mt-24 overflow-hidden border-t border-border/60 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(8,28,80,0.78), rgba(8,28,80,0.92)), url(${FOOTER_IMAGES[idx]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 1.2s ease-in-out",
      }}
    >
      <div className="border-b border-border/60 px-6 py-6">
        <InspirationQuote variant="inline" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full shadow-soft" style={{ background: "linear-gradient(135deg, #ff6f91 0%, #ff3d6e 50%, #e11d48 100%)" }}>
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </span>
            <span className="text-display text-lg font-semibold">MyBlessings</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-white/75">
            When humanity shows up for one another, blessings happen. A transparent giving
            platform connecting generous people with real causes.
          </p>
        </div>
        <div>
          <h4 className="text-display text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link to="/transparency" className="hover:text-white">Transparency</Link></li>
            <li><Link to="/give" className="hover:text-white">Give a Blessing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-display text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link to="/about-myblessings" className="hover:text-white">About MyBlessings</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-6 text-center text-xs text-white/70">
        © {new Date().getFullYear()} www.MyBlessings.US (Yes! Every blessing matters).
      </div>
    </footer>
  );
}