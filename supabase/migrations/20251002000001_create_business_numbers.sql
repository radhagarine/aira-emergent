-- Migration: Create business_numbers table
-- Date: 2025-10-02
-- Description: Table to track phone numbers purchased for businesses

-- Create enum for number types
CREATE TYPE business_number_type AS ENUM (
    'local',
    'toll_free',
    'mobile',
    'international',
    'vanity'
);

-- Create business_numbers table
CREATE TABLE business_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_business_numbers_business_id ON business_numbers(business_id);
CREATE INDEX idx_business_numbers_phone_number ON business_numbers(phone_number);
CREATE INDEX idx_business_numbers_is_primary ON business_numbers(business_id, is_primary) WHERE is_primary = true;

-- Add trigger for updated_at
CREATE TRIGGER update_business_numbers_updated_at
    BEFORE UPDATE ON business_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE business_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view numbers for their businesses"
    ON business_numbers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert numbers for their businesses"
    ON business_numbers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update numbers for their businesses"
    ON business_numbers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete numbers for their businesses"
    ON business_numbers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM business_v2
            WHERE business_v2.id = business_numbers.business_id
            AND business_v2.user_id = auth.uid()
        )
    );
