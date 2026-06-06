-- Revoke column-level access to recipient_user_id from anonymous users
REVOKE SELECT (recipient_user_id) ON public.cases FROM anon;

-- Ensure authenticated users and service role retain access
GRANT SELECT (recipient_user_id) ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;