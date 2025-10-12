-- ============================================================================
-- COMBINED MIGRATION FILE FOR REMOTE SUPABASE DATABASE
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- Migration 1: Create business_numbers table
-- Date: 2025-10-02
-- Description: Table to track phone numbers purchased for businesses

-- Create enum for number types
DO $$ BEGIN
    CREATE TYPE business_number_type AS ENUM (
        'local',
        'toll_free',
        'mobile',
        'international',
        'vanity'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create business_numbers table
CREATE TABLE IF NOT EXISTS business_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    display_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    number_type business_number_type NOT NULL,
    provider TEXT,                              -- twilio, retell, daily, vapi, etc.
    purchase_date TIMESTAMP WITH TIME ZONE,
    monthly_cost DECIMAL(10, 2),                -- Cost in USD
    features JSONB DEFAULT '[]'::jsonb,         -- Array of features (sms, voice, etc.)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Ensure phone number is unique
    CONSTRAINT unique_phone_number UNIQUE(phone_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_numbers_business_id ON business_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_numbers_phone_number ON business_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_business_numbers_is_primary ON business_numbers(business_id, is_primary) WHERE is_primary = true;

-- Add trigger for updated_at (if function exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_business_numbers_updated_at ON business_numbers;
        CREATE TRIGGER update_business_numbers_updated_at
            BEFORE UPDATE ON business_numbers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE business_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view numbers for their businesses" ON business_numbers;
CREATE POLICY "Users can view numbers for their businesses"
    ON business_numbers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert numbers for their businesses" ON business_numbers;
CREATE POLICY "Users can insert numbers for their businesses"
    ON business_numbers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update numbers for their businesses" ON business_numbers;
CREATE POLICY "Users can update numbers for their businesses"
    ON business_numbers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete numbers for their businesses" ON business_numbers;
CREATE POLICY "Users can delete numbers for their businesses"
    ON business_numbers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Migration 2: Fix table naming consistency
-- Date: 2025-10-05
-- Description: Rename to business_numbers_v2 and fix foreign keys
-- ============================================================================

-- Rename table if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_numbers'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_numbers_v2'
    ) THEN
        -- Drop old constraint
        ALTER TABLE business_numbers
        DROP CONSTRAINT IF EXISTS business_numbers_business_id_fkey;

        -- Rename the table
        ALTER TABLE business_numbers RENAME TO business_numbers_v2;

        -- Rename indexes
        ALTER INDEX IF EXISTS idx_business_numbers_business_id RENAME TO idx_business_numbers_v2_business_id;
        ALTER INDEX IF EXISTS idx_business_numbers_phone_number RENAME TO idx_business_numbers_v2_phone_number;
        ALTER INDEX IF EXISTS idx_business_numbers_is_primary RENAME TO idx_business_numbers_v2_is_primary;

        RAISE NOTICE 'Renamed business_numbers to business_numbers_v2';
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_numbers_v2'
    ) THEN
        ALTER TABLE business_numbers_v2
        DROP CONSTRAINT IF EXISTS business_numbers_v2_business_id_fkey;

        ALTER TABLE business_numbers_v2
        ADD CONSTRAINT business_numbers_v2_business_id_fkey
        FOREIGN KEY (business_id) REFERENCES business_v2(id) ON DELETE CASCADE;

        RAISE NOTICE 'Added foreign key constraint to business_v2';
    END IF;
END $$;

-- Update RLS Policies for renamed table
DROP POLICY IF EXISTS "Users can view numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can insert numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can update numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can delete numbers for their businesses" ON business_numbers_v2;

CREATE POLICY "Users can view numbers for their businesses"
    ON business_numbers_v2 FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers_v2.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert numbers for their businesses"
    ON business_numbers_v2 FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers_v2.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update numbers for their businesses"
    ON business_numbers_v2 FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers_v2.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete numbers for their businesses"
    ON business_numbers_v2 FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers_v2.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Migration 3: Add Twilio-specific fields
-- Date: 2025-10-06
-- Description: Add Twilio SID and other provider-specific fields
-- ============================================================================

-- Add Twilio-specific columns if they don't exist
DO $$ BEGIN
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS twilio_sid TEXT UNIQUE;
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS twilio_phone_number_sid TEXT;
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS voice_url TEXT;
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS sms_url TEXT;
    ALTER TABLE business_numbers_v2 ADD COLUMN IF NOT EXISTS status_callback_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Columns already exist, skipping...';
END $$;

-- Create index on twilio_sid for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_numbers_v2_twilio_sid ON business_numbers_v2(twilio_sid);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_numbers_v2'
    ) THEN
        RAISE NOTICE '✓ Table business_numbers_v2 created successfully';
    ELSE
        RAISE EXCEPTION '✗ Table business_numbers_v2 was not created';
    END IF;
END $$;

SELECT 'Migration completed successfully!' AS status;
