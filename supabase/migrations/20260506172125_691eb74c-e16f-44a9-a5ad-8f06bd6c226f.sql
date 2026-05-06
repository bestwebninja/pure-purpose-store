-- Link campaigns to categories
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS category_slug text REFERENCES public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_category_slug ON public.campaigns(category_slug);