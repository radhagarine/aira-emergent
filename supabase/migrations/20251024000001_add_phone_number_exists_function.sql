-- Migration: Add function to check if phone number exists (bypasses RLS)
-- Date: 2025-10-24
-- Description: Creates a SECURITY DEFINER function to check phone number uniqueness
--              across all users while respecting privacy (only returns boolean, no data)

-- Function to check if a phone number already exists in the system
CREATE OR REPLACE FUNCTION phone_number_exists(
  p_phone_number TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if phone number exists (bypasses RLS with SECURITY DEFINER)
  SELECT EXISTS(
    SELECT 1 FROM business_numbers
    WHERE phone_number = p_phone_number
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION phone_number_exists(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION phone_number_exists IS
  'Checks if a phone number already exists in the system (bypasses RLS for uniqueness validation). ' ||
  'Returns only a boolean - does not expose any user data.';
