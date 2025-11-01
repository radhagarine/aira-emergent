-- ============================================================================
-- Migration: Fix business-files bucket security and implement user_id-based paths
-- Date: 2025-11-01
--
-- CRITICAL SECURITY FIXES:
-- 1. Set bucket to PRIVATE (currently public!)
-- 2. Remove overly permissive policies
-- 3. Implement proper business ownership validation
-- 4. Use user_id-based path structure for better organization
--
-- New path structure: {user_id}/{business_id}/{file_type}/{timestamp}.{ext}
-- ============================================================================

-- Step 1: Make the bucket PRIVATE (critical security fix)
UPDATE storage.buckets
SET public = false
WHERE id = 'business-files';

-- Step 2: Drop ALL existing policies on storage.objects for business-files bucket
-- (These are insecure generic policies that were never supposed to be used)
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Also drop any business-specific policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own business files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own business files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own business files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own business files" ON storage.objects;

-- ============================================================================
-- Step 3: Create SECURE policies for business-files bucket
-- Path validation: {user_id}/{business_id}/{file_type}/{timestamp}.{ext}
-- ============================================================================

-- SELECT Policy: Users can only view files in their own user_id folder
CREATE POLICY "Users can view their own business files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-files' AND
  -- Extract user_id from path (first part) and verify it matches authenticated user
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- INSERT Policy: Users can only upload to their own user_id folder
-- AND the business_id in the path must belong to them
CREATE POLICY "Users can upload their own business files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-files' AND
  -- Verify user_id in path matches authenticated user
  (string_to_array(name, '/'))[1] = auth.uid()::text AND
  -- Verify the business_id in the path belongs to the user
  (EXISTS (
    SELECT 1 FROM business_v2
    WHERE id::text = (string_to_array(name, '/'))[2]
    AND user_id = auth.uid()
  ))
);

-- UPDATE Policy: Users can only update files in their own user_id folder
CREATE POLICY "Users can update their own business files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-files' AND
  -- Extract user_id from path and verify it matches authenticated user
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- DELETE Policy: Users can only delete files in their own user_id folder
CREATE POLICY "Users can delete their own business files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-files' AND
  -- Extract user_id from path and verify it matches authenticated user
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- ============================================================================
-- Step 4: Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Users can view their own business files" ON storage.objects IS
'Secure policy for business-files bucket. Path format: {user_id}/{business_id}/{file_type}/{timestamp}.{ext}. Users can only access files in their own user_id folder.';

COMMENT ON POLICY "Users can upload their own business files" ON storage.objects IS
'Secure upload policy. Validates both user_id in path AND business ownership. Prevents unauthorized uploads.';

-- ============================================================================
-- Step 5: Verify the changes (optional - for logging/debugging)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251101000002_fix_business_files_security completed successfully';
  RAISE NOTICE 'Bucket business-files is now PRIVATE';
  RAISE NOTICE 'Secure policies applied with user_id-based path validation';
  RAISE NOTICE 'Path format: {user_id}/{business_id}/{file_type}/{timestamp}.{ext}';
END $$;
