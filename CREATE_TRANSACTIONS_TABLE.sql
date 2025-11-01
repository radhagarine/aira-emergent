-- Create transactions table for wallet functionality
-- Run this in Supabase SQL Editor

-- Create enum for transaction types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'credit',                    -- Money added to wallet
        'debit'                      -- Money deducted from wallet
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for transaction status
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'pending',                   -- Transaction initiated
        'completed',                 -- Successfully processed
        'failed',                    -- Transaction failed
        'refunded'                   -- Money refunded back to wallet
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    payment_method TEXT,                                   -- 'stripe', 'manual', etc.
    stripe_payment_id TEXT,                                -- Stripe Payment Intent ID
    stripe_checkout_session_id TEXT,                       -- Stripe Checkout Session ID
    metadata JSONB DEFAULT '{}'::jsonb,                    -- Additional data
    business_number_id UUID REFERENCES business_numbers(id), -- Link to phone number if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Ensure amount is positive
    CONSTRAINT positive_amount CHECK (amount > 0),

    -- Ensure valid currency
    CONSTRAINT valid_currency CHECK (currency IN ('USD', 'INR'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business_number_id ON transactions(business_number_id);

-- Add trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (user_id = auth.uid());
