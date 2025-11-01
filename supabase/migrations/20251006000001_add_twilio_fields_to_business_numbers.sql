-- Migration: Add Twilio fields to business_numbers
-- Date: 2025-10-06
-- Description: Add Twilio-specific fields for phone number provisioning

-- Add Twilio-specific columns
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS twilio_sid TEXT UNIQUE;
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT;
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS sms_url TEXT;
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS status_callback_url TEXT;
ALTER TABLE business_numbers ADD COLUMN IF NOT EXISTS capabilities JSONB;

-- Create index for Twilio SID for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_numbers_twilio_sid ON business_numbers(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- Add comments
COMMENT ON COLUMN business_numbers.twilio_sid IS 'Twilio IncomingPhoneNumber SID (e.g., PNxxxxx)';
COMMENT ON COLUMN business_numbers.twilio_account_sid IS 'Twilio Account SID that owns this number';
COMMENT ON COLUMN business_numbers.voice_url IS 'Webhook URL for incoming voice calls';
COMMENT ON COLUMN business_numbers.sms_url IS 'Webhook URL for incoming SMS messages';
COMMENT ON COLUMN business_numbers.status_callback_url IS 'Webhook URL for call status updates';
COMMENT ON COLUMN business_numbers.capabilities IS 'Number capabilities: {voice: true, sms: true, mms: false, fax: false}';
