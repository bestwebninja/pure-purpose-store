// =============================================================================
// Data Sovereignty Layer — USA + Israel only.
//
// This module is the SINGLE source of truth for which countries / regions
// are permitted in the MyBlessings platform. It is pure (no server imports)
// and safe to use from both client and server code.
//
// Server functions MUST:
//   * call `normalizeCountry()` before INSERT / UPDATE on any country field
//   * call `assertAllowedCountry()` to reject non-US/IL writes
//   * call `filterAllowedRows()` or `isAllowedLocation()` to scope reads
// =============================================================================

export type AllowedCountry = "US" | "IL";

const ALLOWED: readonly AllowedCountry[] = ["US", "IL"] as const;

/** Returns the canonical list of ISO-2 country codes allowed on the platform. */
export function getAllowedCountries(): readonly AllowedCountry[] {
  return ALLOWED;
}

const US_ALIASES = new Set([
  "us", "u.s.", "u.s", "usa", "u.s.a.", "u.s.a", "united states",
  "united states of america", "america", "united-states",
]);
const IL_ALIASES = new Set([
  "il", "israel", "state of israel", "isr",
]);

/** Normalize a free-form country string to "US", "IL", or null. */
export function normalizeCountry(value: string | null | undefined): AllowedCountry | null {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  if (US_ALIASES.has(v)) return "US";
  if (IL_ALIASES.has(v)) return "IL";
  return null;
}

export function isAllowedCountry(value: string | null | undefined): boolean {
  return normalizeCountry(value) !== null;
}

/** Throws when the input does not resolve to US or IL. */
export function assertAllowedCountry(value: string | null | undefined): AllowedCountry {
  const normalized = normalizeCountry(value);
  if (!normalized) {
    throw new Error(
      `Country "${value ?? ""}" is not permitted. Only United States (US) and Israel (IL) are allowed.`
    );
  }
  return normalized;
}

// ── Location string matching (for tables without a country column) ──────────
const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","PR",
]);
const US_STATE_NAMES = new Set([
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new hampshire","new jersey","new mexico","new york","north carolina",
  "north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
  "south carolina","south dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west virginia","wisconsin","wyoming",
  "district of columbia","washington dc","washington d.c.","puerto rico",
]);
const ISRAEL_KEYWORDS = [
  "israel","tel aviv","jerusalem","haifa","beersheba","be'er sheva",
  "eilat","netanya","ashdod","ashkelon","rishon","petah tikva","holon",
  "bnei brak","ramat gan","herzliya","bat yam","nazareth","tiberias",
  "galilee","negev","west bank","gaza",
];

/**
 * Returns true when a free-form location string clearly references a US state
 * or an Israeli region/city. Used to scope tables that only store `location`
 * as a text field (e.g. campaigns).
 */
export function isAllowedLocation(location: string | null | undefined): boolean {
  if (!location) return false;
  const raw = String(location).trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();

  // Country alias hit
  if (normalizeCountry(raw) !== null) return true;

  // Tokenize and look for state codes / names / Israel keywords
  const tokens = raw
    .split(/[\s,/;|\-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const t of tokens) {
    const upper = t.toUpperCase();
    if (US_STATE_CODES.has(upper)) return true;
  }
  for (const name of US_STATE_NAMES) {
    if (lower.includes(name)) return true;
  }
  for (const kw of ISRAEL_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

/** Generic in-memory filter for rows with a `country` field. */
export function filterAllowedRows<T extends { country?: string | null }>(rows: T[]): T[] {
  return rows.filter((r) => isAllowedCountry(r.country));
}

/** Filter rows that only carry a `location` text field. */
export function filterAllowedByLocation<T extends { location?: string | null }>(rows: T[]): T[] {
  return rows.filter((r) => isAllowedLocation(r.location));
}