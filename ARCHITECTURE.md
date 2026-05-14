# MyBlessings — Architecture Blueprint

_Last updated: 2026-05-14_

This document is the canonical reference for how the MyBlessings platform is wired together. Read it before making structural changes so future work does not silently bypass the security, idempotency, and financial-integrity guarantees the system relies on.

---

## 1. System Overview

MyBlessings is a transparent giving platform where every dollar is tracked, every story is verified, and every recipient is honored. It connects three populations:

- **Recipients** — people who request a blessing via `/request-help` (the "BlessME" flow). They sign up, describe a need, pick a category, and the case enters the matching pipeline.
- **Sponsors** — individuals or organizations who fund blessings. They onboard through `/become-blessing-sponsor`, upload verification docs, and manage giving from `/sponsor/dashboard`.
- **Providers / NGOs** — vetted fulfillment partners (Wolt, Uber, partner NGOs, in-kind providers) who actually deliver the help.

The product is a **TanStack Start** app on Cloudflare Workers, backed by **Lovable Cloud** (Supabase Postgres + Auth + Storage + Realtime). Server work is implemented as TanStack `createServerFn` RPCs and a small set of `/api/public/*` server routes that exist only to receive external traffic (Shopify webhooks, PETRI bloom signals, health checks).

Tech surface area:

- `src/routes/**` — file-based pages and server routes.
- `src/lib/*.functions.ts` — `createServerFn` RPCs called from the UI.
- `src/server/*.functions.ts` and `*.server.ts` — server-only helpers, blocked from client bundling.
- `src/integrations/supabase/*` — auto-generated browser, admin, and middleware Supabase clients (do not edit).
- `supabase/migrations/**` — every schema change, RLS policy, RPC, and trigger.

---

## 2. Domain Map

The codebase is organized around three cooperating domains. Cross-domain calls go through documented server functions, not by reaching into another domain's tables directly.

### 2.1 Routing & PETRI (matching engine)

**Purpose:** turn unstructured help requests into ranked, executable matches between recipients, sponsors, and fulfillment providers.

Key tables: `cases`, `categories`, `assistance_categories`, `petri_tokens`, `petri_matches`, `petri_feedback`, `fulfillment_events`.

Key surfaces:

- `src/routes/request-help.tsx` — recipient sign-up + case intake. Inserts into `cases` and fires a non-blocking `/api/public/petri-bloom` signal.
- `src/routes/api/public/petri-bloom.ts` — the only public ingress for PETRI tokens. HMAC-signed or Supabase-bearer authenticated; size/cardinality capped (8 KB body, 16 `category_ids`).
- `src/server/sponsor-decision.server.ts` + `sponsor-decision.functions.ts` — ranks unassigned `petri_matches` for a sponsor and returns the top 3 with a 1-sentence "AI Reasoning" string. Surfaced via `SponsorRecommendations.tsx`.
- `src/server/match-control.functions.ts` — `executeMatch`, the only path that flips a `petri_match` from `confirmed`/`approved` to `executed`. Status-gated and idempotent (see §4).
- `src/server/fulfillment-router.server.ts` — `pickProvider` maps category slugs to providers via an explicit `SLUG_MAP` (e.g. `elderly-care` → `wolt`, `medical-transport` → `uber`) before falling back to regex.

### 2.2 Financials & Invoicing

**Purpose:** record every cent that moves through the platform with double-entry accounting, idempotent webhook ingestion, and automatic dual invoicing (tax-deductible donation + platform software fee).

Key tables: `donations`, `ledger_entries`, `webhook_events`, `sponsorships`, `invoices`, `campaigns`.

Key surfaces:

- `src/routes/api/public/shopify-webhook.ts` — Shopify order webhook. HMAC verified, idempotent on `webhook_events.event_id` and `donations.shopify_order_id`. Writes the donation, the ledger split (donation revenue, platform fee, beneficiary payable), and increments campaign totals via the `increment_campaign_totals` RPC.
- `src/server/invoicing.functions.ts`:
  - `generateInvoiceForDonation` — idempotently creates an `invoices` row for a settled donation. Uses `next_invoice_number()` to mint `INV-YYYY-000000` IDs.
  - `listSponsorInvoices` — returns a sponsor's invoices and back-fills any missing invoices for donations matching the sponsor's email.
  - **Split rule:** `donation_amount = gross * 0.935`, `platform_fee_amount = gross * 0.065`. Do not change without legal/finance review.
- `src/components/sponsor/SponsorInvoicesList.tsx` — sponsor-facing table with download action, mounted on `/sponsor/dashboard`.

### 2.3 Platform & UI

**Purpose:** identity, navigation, dashboards, design system, public marketing surfaces.

Key tables: `profiles`, `user_roles`, `sponsors`, `providers`, `ngo_applications`, `ngo_profiles`.

Key surfaces:

- `src/routes/__root.tsx` + `src/components/site/SiteHeader.tsx` — global shell, role-aware navigation (recipient / sponsor / admin).
- `src/routes/index.tsx` — marketing home with a single primary CTA ("Give a blessing"); secondary actions are demoted to ghost links.
- `src/routes/sponsor.dashboard.tsx` — composes `SponsorUploadWidget`, `SponsorRecommendations`, and `SponsorInvoicesList`.
- `src/components/sponsor/SponsorUploadWidget.tsx` — logo + verification PDF upload to Supabase Storage; updates `sponsors.logo_url` and `sponsors.doc_url`.
- `src/styles.css` — semantic design tokens (`--primary`, `--gradient-blessing`, `--shadow-glow`, etc.). Components must consume tokens; no inline hex on hero/CTAs.

---

## 3. Data Flows

### 3.1 Shopify Webhook → Ledger → Invoice

```text
Shopify ──HTTPS POST──▶ /api/public/shopify-webhook
                         │
                         ▼
                   verify HMAC (X-Shopify-Hmac-Sha256, SHOPIFY_WEBHOOK_SECRET)
                         │
                         ▼
                   INSERT webhook_events (source, event_id) — UNIQUE(event_id)
                         │  (duplicate? → 200 OK, no-op)
                         ▼
                   INSERT donations (shopify_order_id, amount, ...) — UNIQUE(shopify_order_id)
                         │
                         ▼
                   INSERT ledger_entries (double-entry split):
                     - DR cash 100% / CR donation_revenue 93.5%
                                    / CR platform_fee_revenue 6.5%
                     - CR beneficiary_payable for the donation portion
                         │
                         ▼
                   RPC increment_campaign_totals(campaign_id, amount)
                         │
                         ▼
                   generateInvoiceForDonation(donation_id)
                         │
                         ▼
                   INSERT invoices (invoice_number = next_invoice_number(),
                                    gross_amount, donation_amount,
                                    platform_fee_amount, sponsor_user_id)
                         │
                         ▼
                   Sponsor sees row in SponsorInvoicesList
```

Every step is idempotent: a replayed webhook is rejected at `webhook_events.event_id` UNIQUE; a duplicate order is rejected at `donations.shopify_order_id` UNIQUE; a duplicate invoice is rejected by the `invoices(donation_id)` UNIQUE constraint.

### 3.2 PETRI Match → Fulfillment Event

```text
Recipient submits /request-help
        │
        ▼
INSERT cases (status='PENDING') ──▶ POST /api/public/petri-bloom
        │                                    │
        │                                    ▼
        │                            verify HMAC OR Supabase bearer
        │                            cap body 8 KB, category_ids ≤ 16
        │                                    │
        │                                    ▼
        │                            INSERT petri_tokens
        ▼
PETRI matcher (background) ──▶ INSERT petri_matches (status='pending')
        │
        ▼
Sponsor opens /sponsor/dashboard
        │
        ▼
sponsor-decision.server.ts ranks unassigned matches → top 3 + AI reasoning
        │
        ▼
Sponsor confirms a match → status='confirmed' (or 'approved')
        │
        ▼
executeMatch(match_id):
  - guard: throws match_status_not_executable unless status ∈ {confirmed, approved}
  - guard: throws match_already_executed if execution_status='executed'
  - pickProvider(category) via explicit SLUG_MAP
  - INSERT fulfillment_events (event_type, provider, cost, idempotency_key)
  - UPDATE petri_matches SET execution_status='executed', last_executed_at=now()
        │
        ▼
Provider delivers → fulfillment_events updated with status, response payload
        │
        ▼
petri_feedback collected (rating, comment) — feeds back into match scoring
```

---

## 4. Security & Idempotency Invariants

These are guardrails that **must not regress**. Any PR touching these areas should be reviewed against this section.

### 4.1 Authentication & Authorization

- Auth uses Supabase email/password. **No anonymous sign-ups.** Google social auth is enabled.
- Roles live in `user_roles` (separate table, never on `profiles`). The `has_role(uid, role)` SECURITY DEFINER function is the only sanctioned way to check a role inside RLS. Never inline a self-referential subquery on `user_roles` in a policy — it causes recursive RLS.
- Server functions that need a user identity use the `requireSupabaseAuth` middleware. The browser attaches the bearer token automatically via the `attachSupabaseAuth` global function middleware registered in `src/start.ts` — both pieces must stay wired.
- `supabaseAdmin` (service-role key, in `client.server.ts`) is only used inside verified webhook handlers and trusted server routines. It must never be imported from a client module.

### 4.2 Public Endpoints & HMAC

All `/api/public/*` routes verify the caller before doing any write.

- **`/api/public/shopify-webhook`** — verifies `X-Shopify-Hmac-Sha256` against `SHOPIFY_WEBHOOK_SECRET` using `timingSafeEqual`. Rejects with `401` on mismatch. Body is read once as text for signature verification, then parsed.
- **`/api/public/petri-bloom`** — accepts EITHER an HMAC signature (`x-petri-signature` over the raw body using `PETRI_WEBHOOK_SECRET`) OR a valid Supabase bearer token. Body capped at 8 KB and `category_ids` at 16 entries to prevent DoS / unbounded fan-out.
- **`/api/public/health`**, **`/api/public/go-live-report`** — read-only diagnostics. Never expose user PII.

### 4.3 Idempotency Constraints

- `donations.shopify_order_id` — UNIQUE. One donation per Shopify order.
- `webhook_events.event_id` — UNIQUE. One processing per webhook delivery.
- `invoices(donation_id)` — UNIQUE. One invoice per donation.
- `fulfillment_events.idempotency_key` — application-enforced; events written by `executeMatch` carry the match id so a retry is a no-op.
- `petri_matches.execution_status` is the second guard: `executeMatch` refuses to run twice on the same match.

### 4.4 Atomic Money Math

- `increment_campaign_totals(campaign_id uuid, amount numeric)` — SQL RPC, SECURITY DEFINER, performs `raised_amount = raised_amount + amount` and `donor_count = donor_count + 1` in a single statement. Always use the RPC; never read-modify-write `campaigns` from application code.
- The 93.5% / 6.5% donation/fee split is computed in `src/server/invoicing.functions.ts` and recorded on every `invoices` row. Changing the split requires a migration AND a code change in the invoicing function — both, never one alone.

### 4.5 RLS Posture (summary)

- `cases` — recipient can read/update own; public can read APPROVED / OPEN / FUNDED; admins manage.
- `donations`, `campaigns`, `categories`, `assistance_categories`, `blessings` (active), `providers` (active) — public SELECT (intentional; these power the public site).
- `ledger_entries`, `audit_logs`, `petri_*`, `webhook_events` — admin-only SELECT; writes happen only through server-side code using the admin client after verification.
- `invoices` — sponsor can read own (`sponsor_user_id = auth.uid()`), admin manages.
- `sponsors`, `profiles`, `ngo_profiles`, `user_roles` — owner-scoped via `auth.uid()`; admins have full access via `has_role`.
- `storage.objects` — sponsor logo/doc uploads are scoped by `(storage.foldername(name))[1] = auth.uid()::text`.

### 4.6 Input Validation

- Every server function and `/api/public/*` handler validates input with Zod. Strings have `min`/`max`; arrays have length caps; numbers have bounds; identifiers are regex-restricted.
- Client forms (e.g. `/request-help`) enforce required fields and length limits before the network call, but the server is the source of truth.

---

## 5. Operational Notes

- **Stable URLs for external callers:**
  - Production: `project--737fd275-ad78-47b5-b4fa-52015a1c3375.lovable.app`
  - Preview: `project--737fd275-ad78-47b5-b4fa-52015a1c3375-dev.lovable.app`
- **Secrets** (set via Lovable Cloud, never committed): `SHOPIFY_WEBHOOK_SECRET`, `PETRI_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, plus any provider keys (Wolt, Uber).
- **Do NOT edit:** `src/integrations/supabase/{client,client.server,auth-middleware,auth-attacher,types}.ts`, `src/routeTree.gen.ts`, `.env`, or files under `supabase/migrations/` (create a new migration instead).
- **Server runtime** is Cloudflare Workers with `nodejs_compat`. No `child_process`, `sharp`, `canvas`, or other Node-only native modules.

---

_Keep this file in sync with reality. If you change a flow, update the matching section in the same PR._
