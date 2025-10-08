-- Migration: Create transactions table
-- Date: 2025-10-02
-- Description: Table to track all wallet transactions (credits and debits)

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM (
    'credit',                    -- Money added to wallet
    'debit'                      -- Money deducted from wallet
);

-- Create enum for transaction status
CREATE TYPE transaction_status AS ENUM (
    'pending',                   -- Transaction initiated
    'completed',                 -- Successfully processed
    'failed',                    -- Transaction failed
    'refunded'                   -- Money refunded back to wallet
);

-- Create transactions table
CREATE TABLE transactions (
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
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_stripe_payment_id ON transactions(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;
CREATE INDEX idx_transactions_business_number_id ON transactions(business_number_id) WHERE business_number_id IS NOT NULL;

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
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Don't allow transaction deletion (audit trail)

-- Function to update wallet balance when transaction is completed
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update wallet if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        IF NEW.type = 'credit' THEN
            -- Add money to wallet
            IF NEW.currency = 'USD' THEN
                UPDATE wallets
                SET balance_usd = balance_usd + NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            ELSIF NEW.currency = 'INR' THEN
                UPDATE wallets
                SET balance_inr = balance_inr + NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            END IF;
        ELSIF NEW.type = 'debit' THEN
            -- Deduct money from wallet
            IF NEW.currency = 'USD' THEN
                UPDATE wallets
                SET balance_usd = balance_usd - NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            ELSIF NEW.currency = 'INR' THEN
                UPDATE wallets
                SET balance_inr = balance_inr - NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            END IF;
        END IF;
    END IF;

    -- Handle refunds
    IF NEW.status = 'refunded' AND OLD.status = 'completed' THEN
        IF NEW.type = 'debit' THEN
            -- Refund a debit (add money back)
            IF NEW.currency = 'USD' THEN
                UPDATE wallets
                SET balance_usd = balance_usd + NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            ELSIF NEW.currency = 'INR' THEN
                UPDATE wallets
                SET balance_inr = balance_inr + NEW.amount,
                    updated_at = TIMEZONE('utc'::text, NOW())
                WHERE id = NEW.wallet_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update wallet balance when transaction status changes
CREATE TRIGGER on_transaction_status_change
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance_on_transaction();
