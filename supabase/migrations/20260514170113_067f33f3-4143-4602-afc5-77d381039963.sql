CREATE TABLE public.image_moderation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid,
  kind            text NOT NULL,
  subject_kind    text,
  subject_id      uuid,
  bucket          text,
  path            text,
  model           text,
  verdict         text NOT NULL,
  reason          text,
  smiling_human   boolean,
  confidence      numeric,
  raw_response    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_image_moderation_log_actor   ON public.image_moderation_log (actor_user_id);
CREATE INDEX idx_image_moderation_log_subject ON public.image_moderation_log (subject_kind, subject_id);
CREATE INDEX idx_image_moderation_log_created ON public.image_moderation_log (created_at DESC);

ALTER TABLE public.image_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage moderation log"
  ON public.image_moderation_log
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users read own moderation log"
  ON public.image_moderation_log
  FOR SELECT
  TO authenticated
  USING (actor_user_id = auth.uid());