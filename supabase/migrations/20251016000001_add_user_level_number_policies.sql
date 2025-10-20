-- Migration: Add RLS policies for user-level phone numbers
-- Date: 2025-10-16
-- Description: Allow users to access phone numbers directly owned by them (user_id column)
--              in addition to numbers owned through businesses (business_id column)

-- First, make business_id nullable since users can own numbers directly
ALTER TABLE business_numbers ALTER COLUMN business_id DROP NOT NULL;

-- Add user_id column to track direct user ownership
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_business_numbers_user_id ON business_numbers(user_id);

-- Add RLS policy for user-owned numbers (SELECT)
CREATE POLICY "Users can view their own numbers"
    ON business_numbers FOR SELECT
    USING (user_id = auth.uid());

-- Add RLS policy for user-owned numbers (INSERT)
CREATE POLICY "Users can insert their own numbers"
    ON business_numbers FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Add RLS policy for user-owned numbers (UPDATE)
CREATE POLICY "Users can update their own numbers"
    ON business_numbers FOR UPDATE
    USING (user_id = auth.uid());

-- Add RLS policy for user-owned numbers (DELETE)
CREATE POLICY "Users can delete their own numbers"
    ON business_numbers FOR DELETE
    USING (user_id = auth.uid());

-- Add constraint to ensure either user_id or business_id is set (but not both null)
ALTER TABLE business_numbers ADD CONSTRAINT business_numbers_owner_check
    CHECK (user_id IS NOT NULL OR business_id IS NOT NULL);
