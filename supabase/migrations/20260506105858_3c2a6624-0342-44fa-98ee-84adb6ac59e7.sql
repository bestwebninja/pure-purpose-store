
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'ngo', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- NGO Applications
CREATE TABLE public.ngo_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  causes TEXT[] NOT NULL DEFAULT '{}',
  geography TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  trust_score NUMERIC NOT NULL DEFAULT 0,
  intelligence_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ngo_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit ngo application" ON public.ngo_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read own application" ON public.ngo_applications
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update applications" ON public.ngo_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete applications" ON public.ngo_applications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ngo_applications_set_updated_at
  BEFORE UPDATE ON public.ngo_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- NGO Profiles
CREATE TABLE public.ngo_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES public.ngo_applications(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ngo_id)
);

ALTER TABLE public.ngo_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins read ngo profiles" ON public.ngo_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners insert own ngo profile" ON public.ngo_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners update own ngo profile" ON public.ngo_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete ngo profiles" ON public.ngo_profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ngo_profiles_set_updated_at
  BEFORE UPDATE ON public.ngo_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER TABLE public.ngo_applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ngo_applications;
