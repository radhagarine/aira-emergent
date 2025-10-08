-- Migration: Create wallets table
-- Date: 2025-10-02
-- Description: Table to track user wallet balances (one wallet per user)

-- Create wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_usd DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    balance_inr DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,          -- Primary currency (USD or INR)
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Ensure one wallet per user
    CONSTRAINT unique_user_wallet UNIQUE(user_id),

    -- Ensure balances are never negative
    CONSTRAINT positive_balance_usd CHECK (balance_usd >= 0),
    CONSTRAINT positive_balance_inr CHECK (balance_inr >= 0),

    -- Ensure valid currency
    CONSTRAINT valid_currency CHECK (currency IN ('USD', 'INR'))
);

-- Create indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_active ON wallets(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
    ON wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- Don't allow wallet deletion (business rule)
-- Users should be able to deactivate, not delete

-- Function to automatically create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance_usd, balance_inr, currency)
    VALUES (NEW.id, 0.00, 0.00, 'USD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when user signs up
CREATE TRIGGER on_user_created_create_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_new_user();
