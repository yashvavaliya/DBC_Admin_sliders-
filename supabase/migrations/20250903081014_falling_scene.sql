/*
  # Fix Unique Slug Generation for Multiple Public Cards

  1. Changes
    - Ensure all existing cards have unique slugs
    - Update slug generation function to be more robust
    - Add constraint to prevent duplicate slugs

  2. Security
    - No changes to existing RLS policies
    - Maintains existing security model
*/

-- First, let's ensure all existing cards have unique slugs
DO $$
DECLARE
  card_record RECORD;
  new_slug text;
  counter integer;
BEGIN
  -- Loop through all cards that don't have slugs or have duplicate slugs
  FOR card_record IN 
    SELECT id, title, user_id 
    FROM business_cards 
    WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug from title or fallback
    new_slug := lower(regexp_replace(
      COALESCE(card_record.title, 'card-' || substr(card_record.user_id::text, 1, 8)), 
      '[^a-zA-Z0-9]+', '-', 'g'
    ));
    new_slug := trim(both '-' from new_slug);
    
    -- If empty, use user ID prefix
    IF new_slug = '' THEN
      new_slug := 'card-' || substr(card_record.user_id::text, 1, 8);
    END IF;
    
    -- Ensure uniqueness
    counter := 0;
    WHILE EXISTS (SELECT 1 FROM business_cards WHERE slug = new_slug AND id != card_record.id) LOOP
      counter := counter + 1;
      new_slug := new_slug || '-' || counter;
    END LOOP;
    
    -- Update the card with unique slug
    UPDATE business_cards 
    SET slug = new_slug 
    WHERE id = card_record.id;
  END LOOP;
END $$;

-- Now handle any remaining duplicate slugs
DO $$
DECLARE
  duplicate_record RECORD;
  new_slug text;
  counter integer;
BEGIN
  -- Find and fix any remaining duplicates
  FOR duplicate_record IN 
    SELECT id, slug, title, user_id,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM business_cards 
    WHERE slug IS NOT NULL
  LOOP
    -- If this is not the first occurrence of this slug
    IF duplicate_record.rn > 1 THEN
      new_slug := duplicate_record.slug;
      counter := duplicate_record.rn - 1;
      
      -- Keep incrementing until we find a unique slug
      WHILE EXISTS (SELECT 1 FROM business_cards WHERE slug = new_slug || '-' || counter AND id != duplicate_record.id) LOOP
        counter := counter + 1;
      END LOOP;
      
      new_slug := new_slug || '-' || counter;
      
      -- Update with unique slug
      UPDATE business_cards 
      SET slug = new_slug 
      WHERE id = duplicate_record.id;
    END IF;
  END LOOP;
END $$;

-- Improve the slug generation function
CREATE OR REPLACE FUNCTION generate_unique_slug(input_text text, table_name text DEFAULT 'business_cards')
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
  random_suffix text;
BEGIN
  -- Create base slug from input text
  base_slug := lower(regexp_replace(COALESCE(input_text, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If empty or too short, use random string
  IF base_slug = '' OR length(base_slug) < 2 THEN
    random_suffix := substr(gen_random_uuid()::text, 1, 8);
    base_slug := 'card-' || random_suffix;
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM business_cards WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
    
    -- Prevent infinite loops
    IF counter > 1000 THEN
      random_suffix := substr(gen_random_uuid()::text, 1, 8);
      final_slug := base_slug || '-' || random_suffix;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION set_card_slug()
RETURNS trigger AS $$
BEGIN
  -- Always generate a new slug if one isn't provided or if it's empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(COALESCE(NEW.title, 'card'), 'business_cards');
  ELSE
    -- If a slug is provided, ensure it's unique
    DECLARE
      counter integer := 0;
      base_slug text := NEW.slug;
      test_slug text := NEW.slug;
    BEGIN
      WHILE EXISTS (SELECT 1 FROM business_cards WHERE slug = test_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        test_slug := base_slug || '-' || counter;
      END LOOP;
      NEW.slug := test_slug;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is properly set up
DROP TRIGGER IF EXISTS set_business_card_slug ON business_cards;
CREATE TRIGGER set_business_card_slug
  BEFORE INSERT OR UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION set_card_slug();

-- Add a unique constraint on slug to prevent future duplicates
DO $$
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'business_cards_slug_unique' 
    AND table_name = 'business_cards'
  ) THEN
    ALTER TABLE business_cards ADD CONSTRAINT business_cards_slug_unique UNIQUE (slug);
  END IF;
END $$;