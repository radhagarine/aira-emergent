-- Migration: Add timezone field to business_v2 table
-- Created: 2025-10-30
-- Purpose: Store business timezone for automatic appointment scheduling

-- Add timezone column to business_v2
ALTER TABLE business_v2
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Add comment for documentation
COMMENT ON COLUMN business_v2.timezone IS 'IANA timezone identifier for business location (e.g., America/New_York, Asia/Kolkata, Europe/London). Used for appointment scheduling and voice bot interactions.';

-- Create index for timezone queries (optional but helpful for analytics)
CREATE INDEX IF NOT EXISTS idx_business_v2_timezone ON business_v2(timezone);

-- Update existing businesses to have a default timezone based on phone or default to UTC
-- This is a safe default - businesses can update it later
UPDATE business_v2
SET timezone = 'America/New_York'
WHERE timezone IS NULL;

-- For businesses with phone numbers, we could infer timezone (optional)
-- Example: Update based on area code or leave as is for manual update
-- UPDATE business_v2 SET timezone = 'America/Los_Angeles' WHERE phone LIKE '+1415%' OR phone LIKE '+1510%';
-- UPDATE business_v2 SET timezone = 'America/Chicago' WHERE phone LIKE '+1312%' OR phone LIKE '+1773%';

-- Add validation constraint (optional - ensures valid IANA timezone format)
-- Note: This is a basic check, not exhaustive
ALTER TABLE business_v2
ADD CONSTRAINT business_v2_timezone_format_check
CHECK (
  timezone IS NULL OR
  timezone ~ '^[A-Z][a-zA-Z_]*(/[A-Z][a-zA-Z_]*)*$'
);

-- Grant appropriate permissions (adjust based on your RLS setup)
-- GRANT SELECT ON business_v2 TO authenticated;
-- GRANT UPDATE ON business_v2 TO authenticated;
