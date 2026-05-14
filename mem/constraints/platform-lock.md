---
name: MyBlessings Platform Lock
description: Canonical production baseline declared. Extend-only mode across all platform layers.
type: constraint
---
**MYBLESSINGS_PLATFORM_LOCKED = TRUE**

The current repository is the canonical production baseline. All future work is extend-only.

## Preservation rules (do not modify without explicit user approval)
- **Routes**: every file in `src/routes/` (public, admin, api/public, dashboard, sponsor, ngo, me, sitemap)
- **Schema**: every Supabase table, RLS policy, trigger, function currently defined
- **UI**: SiteHeader, SiteFooter, existing page layouts, BlessingLifecycle, BlessingPaymentForm, CampaignCard, DonationPanel, PetriGraphView

## Extend-only means
- New routes, components, server functions, tables, columns: allowed
- Renames, deletions, structural refactors, breaking signature changes: NOT allowed without explicit user confirmation
- Bugfixes that preserve external behavior: allowed

## Registered platform layers
1. **Marketplace** — `/marketplace`, `/explore-blessings`, `/categories`, `campaigns` table, `getMarketplaceFeed`
2. **Commerce** — Shopify webhook (`/api/public/shopify-webhook`), `donations`, `ledger_entries`, `BlessingPaymentForm`, checkout server fns
3. **Lifecycle** — `BlessingLifecycle` component, `getLifecycleCounts`, `useLifecycleRealtime`; stages: Requested → Matched → Funded → Delivered → Story Published → Followup Active
4. **Identity Graph** — `profiles`, `user_roles`, `sponsors`, `ngo_profiles`, `providers`, auth-middleware
5. **Intelligence** — `petri_tokens`, `petri_matches`, `petri_feedback`, match-control, fulfillment-router, blog/followup engines
6. **Admin Command Center** — `/admin/command-center`, `/admin/match-control`, `/admin/ngo-dashboard`, `/admin/sponsors`, snapshot + go-live-report APIs

**Why:** User declared production baseline lock. Destructive changes risk breaking the live platform.
