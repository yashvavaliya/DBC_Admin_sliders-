/*
  # Fix update_card_counts Function

  1. Changes
    - Remove references to the dropped `reviews` table
    - Remove references to dropped columns `reviews_count` and `average_rating`
    - Keep only `social_media_count` and `media_count` updates

  2. Security
    - No changes to RLS policies needed
    - Function maintains existing security model
*/

-- Drop and recreate the update_card_counts function without reviews references
CREATE OR REPLACE FUNCTION update_card_counts()
RETURNS trigger AS $$
BEGIN
  -- Update social media count
  UPDATE business_cards 
  SET social_media_count = (
    SELECT COUNT(*) FROM social_links 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  -- Update media count
  UPDATE business_cards 
  SET media_count = (
    SELECT COUNT(*) FROM media_items 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;