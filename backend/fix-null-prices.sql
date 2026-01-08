-- Migration to fix null prices in existing events
-- Run this SQL query to update all existing events with null prices to 0.00

UPDATE events SET price = 0.00 WHERE price IS NULL;

-- Verify the update
SELECT COUNT(*) as updated_count FROM events WHERE price = 0.00;

-- Optional: Add NOT NULL constraint after update (if desired)
-- ALTER TABLE events ALTER COLUMN price SET NOT NULL;
-- ALTER TABLE events ALTER COLUMN price SET DEFAULT 0.00;
