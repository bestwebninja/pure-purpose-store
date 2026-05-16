import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.join(__dirname, "..", "package.json");

// Read package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Ensure scripts exist
pkg.scripts ||= {};

// Inject safe dev pipeline
pkg.scripts.dev =
  "powershell -ExecutionPolicy Bypass -File scripts/arch-guard.ps1 && vite dev";

pkg.scripts.build = "vite build";
pkg.scripts.preview = "vite preview";

console.log("🧬 Updating package.json scripts...");

// Write back formatted JSON
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("✅ package.json updated successfully");