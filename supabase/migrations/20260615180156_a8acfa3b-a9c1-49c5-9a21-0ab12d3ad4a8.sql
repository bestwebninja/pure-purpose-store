
-- Hide remaining location field from public clients
REVOKE SELECT (region) ON public.cases FROM anon;
REVOKE SELECT (region) ON public.cases FROM authenticated;

-- Lock system_modules to admins only
DROP POLICY IF EXISTS "Authenticated can read system modules" ON public.system_modules;
CREATE POLICY "Admins can read system modules"
  ON public.system_modules
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
