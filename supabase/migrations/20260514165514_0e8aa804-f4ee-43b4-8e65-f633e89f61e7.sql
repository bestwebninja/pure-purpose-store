-- Phase 1: Identity + Structured Allocation on cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS salutation       text,
  ADD COLUMN IF NOT EXISTS address_line1    text,
  ADD COLUMN IF NOT EXISTS city             text,
  ADD COLUMN IF NOT EXISTS state            text,
  ADD COLUMN IF NOT EXISTS postal_code      text,
  ADD COLUMN IF NOT EXISTS allocation_needs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Validation trigger: enforce shape + vegan-only food rule
CREATE OR REPLACE FUNCTION public.validate_case_allocation_needs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  itype text;
  ifood text;
  allowed_types text[] := ARRAY[
    'accommodation','travel','food','medical','clothing',
    'education','childcare','employment','utilities','other'
  ];
  allowed_food text[] := ARRAY[
    'vegan','pure-veg','raw-organic','fruit-and-veg-basket'
  ];
BEGIN
  IF NEW.allocation_needs IS NULL THEN
    NEW.allocation_needs := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(NEW.allocation_needs) <> 'array' THEN
    RAISE EXCEPTION 'allocation_needs must be a JSON array';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.allocation_needs)
  LOOP
    IF jsonb_typeof(item) <> 'object' THEN
      RAISE EXCEPTION 'each allocation need must be a JSON object';
    END IF;

    itype := lower(coalesce(item->>'type',''));
    IF itype = '' OR NOT (itype = ANY(allowed_types)) THEN
      RAISE EXCEPTION 'invalid allocation need type: %', item->>'type';
    END IF;

    IF itype = 'food' THEN
      ifood := lower(coalesce(item->>'food_kind',''));
      IF ifood = '' OR NOT (ifood = ANY(allowed_food)) THEN
        RAISE EXCEPTION 'food allocation must specify food_kind in (vegan, pure-veg, raw-organic, fruit-and-veg-basket)';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_case_allocation_needs ON public.cases;
CREATE TRIGGER trg_validate_case_allocation_needs
  BEFORE INSERT OR UPDATE OF allocation_needs ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.validate_case_allocation_needs();

CREATE INDEX IF NOT EXISTS idx_cases_allocation_needs
  ON public.cases USING GIN (allocation_needs);