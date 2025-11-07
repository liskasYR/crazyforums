-- Fix search_path for generate_unique_slug function
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_slug text;
  counter integer := 0;
BEGIN
  -- Create initial slug from title (simple version)
  new_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  new_slug := trim(both '-' from new_slug);
  
  -- If empty, use random string
  IF new_slug = '' THEN
    new_slug := 'form-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.forms WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := new_slug || '-' || counter::text;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;