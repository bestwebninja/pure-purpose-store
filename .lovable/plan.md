## MyBlessings Platform Synchronization Plan

Extending the platform with NGO onboarding, admin dashboard, categories, and seed data — without touching Shopify, donations, or payment logic.

### 1. Database Migration (Supabase)

New tables (all with RLS):

- **`app_role` enum**: `admin`, `ngo`, `user`
- **`user_roles`**: `id`, `user_id` (→ auth.users), `role` (app_role), unique(user_id, role)
- **`has_role(uuid, app_role)`** security-definer function (prevents recursive RLS)
- **`categories`**: `id`, `slug`, `name`, `description`, `icon`, `sort_order`
- **`ngo_applications`**: `id`, `name`, `email`, `country`, `causes` (text[]), `geography`, `status` (PENDING/ACTIVE/REJECTED), `trust_score` (numeric), `intelligence_status` (text), `submitted_by` (uuid nullable), `created_at`, `updated_at`
- **`ngo_profiles`**: `id`, `user_id` (→ auth.users), `ngo_id` (→ ngo_applications), `display_name`, `created_at`
- **`audit_logs`**: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `created_at`

RLS policies:

- `categories`: public read
- `ngo_applications`: public INSERT (onboarding), admin SELECT/UPDATE, owner SELECT (via submitted_by)
- `ngo_profiles`: owner + admin read/write
- `user_roles`: admin manage; user reads own
- `audit_logs`: admin read; server-only insert

Realtime: add `ngo_applications` to `supabase_realtime` publication.

### 2. Seed Data (insert tool, after migration)

- 6 categories
- 3 sample campaigns (if `campaigns` empty)
- 5 NGO applications (mix of PENDING/ACTIVE/REJECTED) with trust scores
- Note: admin user role seeded via instructions (needs an existing auth user id) — provide UI/SQL snippet for the user to grant themselves admin

### 3. New Routes

```
src/routes/
  ngo.tsx                        → /ngo landing
  ngo.onboarding.tsx             → /ngo/onboarding (multi-step form)
  categories.tsx                 → /categories (browse)
  admin.ngo-dashboard.tsx        → /admin/ngo-dashboard (admin gated)
```

Each gets dedicated `head()` SEO metadata.

### 4. Server Functions

`src/server/ngo.functions.ts`:
- `submitNgoApplication` — public; inserts into `ngo_applications`, runs `runIntelligenceCheck()` (stub returns trust_score + intelligence_status), inserts audit_logs entry
- `listNgoApplications` — admin only (uses `requireSupabaseAuth` + `has_role` check)
- `updateNgoStatus` — admin only; sets ACTIVE/REJECTED, writes audit_logs

`src/server/admin.functions.ts`:
- `checkIsAdmin` — returns whether current user has admin role

### 5. Admin Dashboard

- Lists applications (name, email, country, causes, trust_score, intelligence_status, status)
- Approve / Reject buttons
- Realtime subscription on `ngo_applications` (INSERT/UPDATE) to refresh table
- Gated: redirects to `/login` if not authenticated, shows "Forbidden" if not admin

### 6. NGO Onboarding Form

Multi-step (3 steps): Org info → Causes & geography → Review/submit.
On submit → calls `submitNgoApplication` server function.

### 7. Categories Page

Server function `listCategories` (public). Grid of cards with icon + name + description.

### 8. SiteHeader Update

Add nav links:
- `/ngo` (always visible)
- `/categories` (always visible)
- `/admin/ngo-dashboard` (only when current user has admin role — checked via lightweight client query to `user_roles`)

Keeps existing Blessings, How It Works, Transparency, About, Login, Give a Blessing button untouched.

### 9. Safety Boundaries

Untouched files:
- `src/server/checkout.functions.ts`
- `src/lib/shopify.ts`
- `src/routes/api/public/shopify-webhook.ts`
- `src/routes/give.tsx`, `campaign.$handle.tsx`
- `donations`, `webhook_events`, `campaigns` tables (campaigns gets seeded only)

### Technical Notes

- `runIntelligenceCheck()` is a stub returning `{ trust_score: random 60-95, intelligence_status: 'AUTO_REVIEWED' }` — placeholder for future AI integration. Documented as TODO.
- Admin seeding requires a real `auth.users` id; included SQL snippet shown to user post-migration so they can grant themselves admin via Cloud Users panel.
- Realtime uses existing `useCampaignRealtime` pattern.

---

After approval I'll create the migration first, then ask you to confirm before adding routes/seed data/code.
