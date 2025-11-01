-- Migration: Add atomic wallet balance update function
-- Date: 2025-10-22
-- Description: Creates a database function for atomic wallet balance updates
--              to prevent race conditions in concurrent transactions

-- Function to atomically update wallet balance with row-level locking
CREATE OR REPLACE FUNCTION update_wallet_balance_atomic(
  p_wallet_id UUID,
  p_amount DECIMAL,
  p_currency TEXT
) RETURNS wallets AS $$
DECLARE
  v_wallet wallets;
  v_new_balance_usd DECIMAL;
  v_new_balance_inr DECIMAL;
BEGIN
  -- Lock the wallet row for update to prevent concurrent modifications
  SELECT * INTO v_wallet
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  -- Check if wallet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found: %', p_wallet_id;
  END IF;

  -- Calculate new balances
  IF p_currency = 'USD' THEN
    v_new_balance_usd := v_wallet.balance_usd + p_amount;
    v_new_balance_inr := v_wallet.balance_inr;

    -- Check for negative balance
    IF v_new_balance_usd < 0 THEN
      RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %',
        ABS(p_amount), v_wallet.balance_usd;
    END IF;
  ELSIF p_currency = 'INR' THEN
    v_new_balance_usd := v_wallet.balance_usd;
    v_new_balance_inr := v_wallet.balance_inr + p_amount;

    -- Check for negative balance
    IF v_new_balance_inr < 0 THEN
      RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %',
        ABS(p_amount), v_wallet.balance_inr;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid currency: %. Must be USD or INR', p_currency;
  END IF;

  -- Perform atomic update
  UPDATE wallets
  SET
    balance_usd = v_new_balance_usd,
    balance_inr = v_new_balance_inr,
    updated_at = NOW()
  WHERE id = p_wallet_id
  RETURNING * INTO v_wallet;

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_wallet_balance_atomic(UUID, DECIMAL, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_wallet_balance_atomic IS
  'Atomically updates wallet balance with row-level locking to prevent race conditions. ' ||
  'Use positive amounts for deposits, negative amounts for withdrawals.';
