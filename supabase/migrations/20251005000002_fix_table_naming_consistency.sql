-- Migration: Fix table naming consistency
-- Date: 2025-10-05
-- Description: Align all table names with _v2 suffix convention and fix foreign key references
-- This migration is SAFE - uses RENAME instead of DROP/CREATE to preserve data

-- ============================================================================
-- PART 1: Rename tables to add _v2 suffix
-- ============================================================================

-- Check if business_numbers exists without _v2 and rename it
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
        -- First, drop the foreign key constraint
        ALTER TABLE business_numbers
        DROP CONSTRAINT IF EXISTS business_numbers_business_id_fkey;

        -- Rename the table
        ALTER TABLE business_numbers RENAME TO business_numbers_v2;

        -- Rename indexes to match new table name
        ALTER INDEX IF EXISTS idx_business_numbers_business_id RENAME TO idx_business_numbers_v2_business_id;
        ALTER INDEX IF EXISTS idx_business_numbers_phone_number RENAME TO idx_business_numbers_v2_phone_number;
        ALTER INDEX IF EXISTS idx_business_numbers_is_primary RENAME TO idx_business_numbers_v2_is_primary;

        RAISE NOTICE 'Renamed business_numbers to business_numbers_v2';
    END IF;
END $$;

-- ============================================================================
-- PART 2: Fix foreign key references
-- ============================================================================

-- Add back the foreign key constraint with correct reference
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_numbers_v2'
    ) THEN
        -- Add constraint to business_v2 if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'business_v2'
        ) THEN
            ALTER TABLE business_numbers_v2
            ADD CONSTRAINT business_numbers_v2_business_id_fkey
            FOREIGN KEY (business_id) REFERENCES business_v2(id) ON DELETE CASCADE;

            RAISE NOTICE 'Added foreign key constraint to business_v2';
        END IF;
    END IF;
END $$;

-- Fix chatbot_conversations foreign key if business_v2 exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'chatbot_conversations'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'business_v2'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE chatbot_conversations
        DROP CONSTRAINT IF EXISTS chatbot_conversations_business_id_fkey;

        -- Add new constraint
        ALTER TABLE chatbot_conversations
        ADD CONSTRAINT chatbot_conversations_business_id_fkey
        FOREIGN KEY (business_id) REFERENCES business_v2(id) ON DELETE CASCADE;

        RAISE NOTICE 'Fixed chatbot_conversations foreign key';
    END IF;
END $$;

-- ============================================================================
-- PART 3: Update RLS Policies for renamed table
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can insert numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can update numbers for their businesses" ON business_numbers_v2;
DROP POLICY IF EXISTS "Users can delete numbers for their businesses" ON business_numbers_v2;

-- Create new policies with correct table reference
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
-- PART 4: Add missing tables from schema documentation
-- ============================================================================

-- Create business_booking_config table
CREATE TABLE IF NOT EXISTS business_booking_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL,
    default_duration_minutes INTEGER DEFAULT 60,
    slot_interval_minutes INTEGER DEFAULT 15,
    max_advance_days INTEGER DEFAULT 30,
    min_advance_hours INTEGER DEFAULT 2,
    max_concurrent_bookings INTEGER DEFAULT 1,
    allow_overbooking BOOLEAN DEFAULT false,
    overbooking_percentage INTEGER DEFAULT 0,
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,
    require_phone BOOLEAN DEFAULT true,
    require_email BOOLEAN DEFAULT false,
    auto_confirm BOOLEAN DEFAULT true,
    allow_cancellation BOOLEAN DEFAULT true,
    cancellation_deadline_hours INTEGER DEFAULT 24,
    google_calendar_id TEXT,
    sync_to_google_calendar BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create business_hours table
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    service_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT business_hours_unique_day UNIQUE (business_id, day_of_week, service_type)
);

-- Create business_special_dates table
CREATE TABLE IF NOT EXISTS business_special_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    open_time TIME,
    close_time TIME,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT business_special_dates_unique UNIQUE (business_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_booking_config_business_id ON business_booking_config(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day_of_week ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_business_special_dates_business_id ON business_special_dates(business_id);
CREATE INDEX IF NOT EXISTS idx_business_special_dates_date ON business_special_dates(date);

-- Enable RLS on new tables
ALTER TABLE business_booking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_special_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_booking_config
CREATE POLICY "Users can view their business booking config"
    ON business_booking_config FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_booking_config.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their business booking config"
    ON business_booking_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_booking_config.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

-- RLS Policies for business_hours
CREATE POLICY "Users can view their business hours"
    ON business_hours FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_hours.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their business hours"
    ON business_hours FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_hours.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

-- RLS Policies for business_special_dates
CREATE POLICY "Users can view their business special dates"
    ON business_special_dates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_special_dates.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their business special dates"
    ON business_special_dates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_special_dates.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Migration 20251005000002 completed successfully!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '1. Renamed business_numbers -> business_numbers_v2';
    RAISE NOTICE '2. Fixed all foreign key references to business_v2';
    RAISE NOTICE '3. Updated RLS policies';
    RAISE NOTICE '4. Added business_booking_config table';
    RAISE NOTICE '5. Added business_hours table';
    RAISE NOTICE '6. Added business_special_dates table';
    RAISE NOTICE '=================================================';
END $$;
