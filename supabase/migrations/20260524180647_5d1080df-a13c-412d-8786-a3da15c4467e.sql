-- Protect recipient home addresses from public exposure on cases table.
-- Strategy: revoke column-level SELECT on address fields from anon and authenticated.
-- Admins and the recipient themselves access addresses via security-definer paths
-- (server functions using supabaseAdmin); RLS policy continues to allow row access
-- for status/recipient/admin, but PostgREST will not return address columns to
-- anon/authenticated callers.

REVOKE SELECT (address_line1, city, state, postal_code, country)
  ON public.cases FROM anon;

REVOKE SELECT (address_line1, city, state, postal_code, country)
  ON public.cases FROM authenticated;

-- Grant address column access only to the service role (used by supabaseAdmin
-- in server functions, which already enforce auth/role checks).
GRANT SELECT (address_line1, city, state, postal_code, country)
  ON public.cases TO service_role;