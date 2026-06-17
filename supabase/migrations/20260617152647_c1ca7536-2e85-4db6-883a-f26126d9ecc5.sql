CREATE POLICY "Submitters read own corporate application"
  ON public.corporate_sponsors
  FOR SELECT
  TO authenticated
  USING (submitted_by IS NOT NULL AND submitted_by = auth.uid());