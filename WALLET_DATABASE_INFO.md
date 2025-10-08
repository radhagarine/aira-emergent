# Wallet Database Information

## 📊 Database Tables

### 1. **`wallets` Table** - Stores User Balances

**Location:** Supabase → Table Editor → wallets

**Schema:**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd DECIMAL(10, 2) DEFAULT 0.00,
  balance_inr DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique wallet ID
- `user_id` - Link to authenticated user (from Supabase Auth)
- `balance_usd` - USD balance (e.g., 50.00)
- `balance_inr` - INR balance (e.g., 4000.00)
- `created_at` - When wallet was created
- `updated_at` - Last update timestamp

**Example Data:**
```
user_id                              | balance_usd | balance_inr
-------------------------------------|-------------|-------------
550e8400-e29b-41d4-a716-446655440000 | 50.00       | 0.00
```

---

### 2. **`transactions` Table** - Records All Payments

**Location:** Supabase → Table Editor → transactions

**Schema:**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_id UUID REFERENCES wallets(id),
  type TEXT NOT NULL, -- 'credit' or 'debit'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL, -- 'USD' or 'INR'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  description TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  business_number_id UUID REFERENCES business_numbers(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique transaction ID
- `user_id` - User who made the transaction
- `type` - `credit` (money added) or `debit` (money spent)
- `amount` - Transaction amount
- `currency` - `USD` or `INR`
- `status` - `pending`, `completed`, or `failed`
- `description` - Human-readable description
- `stripe_checkout_session_id` - Stripe session ID (for payments)
- `business_number_id` - Link to phone number purchase (if applicable)

**Example Data:**
```
id   | user_id | type   | amount | currency | status    | description
-----|---------|--------|--------|----------|-----------|---------------------------
1    | user123 | credit | 50.00  | USD      | completed | Wallet top-up via USD
2    | user123 | debit  | 1.50   | USD      | completed | Phone number purchase...
```

---

## 🔄 How Wallet Updates Work

### Payment Flow:

```
1. User clicks "Add Funds" → Selects $50 USD
   ↓
2. Creates pending transaction in database
   ↓
3. Redirects to Stripe Checkout
   ↓
4. User completes payment on Stripe
   ↓
5. Stripe sends webhook to: /api/payment/webhook
   ↓
6. Webhook handler:
   - Updates transaction status: pending → completed
   - Calls wallet service: addFunds(userId, 50, 'USD')
   ↓
7. Wallet service updates:
   - wallets.balance_usd += 50.00
   - wallets.updated_at = NOW()
   ↓
8. User redirected back to /dashboard/funds
   ↓
9. Frontend fetches new balance from /api/wallet/balance
   ↓
10. UI updates to show $50.00 balance
```

---

## 🔍 Checking Your Wallet Data

### Via Supabase Dashboard:

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/wydvhmmsauoseyquxbfs
   ```

2. **Check Wallets:**
   - Click "Table Editor" in left sidebar
   - Select "wallets" table
   - Look for your user_id
   - See balance_usd and balance_inr columns

3. **Check Transactions:**
   - Click "Table Editor" → "transactions"
   - Filter by your user_id
   - See all transactions with status
   - Check stripe_checkout_session_id for payments

### Via SQL Editor:

```sql
-- Get your wallet balance
SELECT * FROM wallets
WHERE user_id = 'your-user-id-here';

-- Get recent transactions
SELECT
  id,
  type,
  amount,
  currency,
  status,
  description,
  created_at
FROM transactions
WHERE user_id = 'your-user-id-here'
ORDER BY created_at DESC
LIMIT 10;

-- Get payment transactions only
SELECT * FROM transactions
WHERE user_id = 'your-user-id-here'
AND stripe_checkout_session_id IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🐛 Debugging Payment Issues

### Issue: Payment succeeded but balance didn't update

**Check these:**

1. **Transaction was created:**
   ```sql
   SELECT * FROM transactions
   WHERE stripe_checkout_session_id = 'cs_test_...'
   ```
   Expected: One row with status 'pending' or 'completed'

2. **Webhook was received:**
   - Go to Stripe Dashboard → Webhooks → Your endpoint → Logs
   - Look for `checkout.session.completed` event
   - Status should be "200 OK"

3. **Wallet was updated:**
   ```sql
   SELECT * FROM wallets
   WHERE user_id = 'your-user-id';
   ```
   Expected: balance_usd should have increased

4. **Check server logs:**
   ```bash
   # Look for webhook processing logs
   grep "Payment completed for user" logs.txt
   ```

---

## 📈 Manual Balance Adjustment (Admin Only)

If you need to manually adjust a user's balance:

```sql
-- Add $100 to user's USD balance
UPDATE wallets
SET balance_usd = balance_usd + 100.00,
    updated_at = NOW()
WHERE user_id = 'user-id-here';

-- Record the manual adjustment
INSERT INTO transactions (
  user_id,
  wallet_id,
  type,
  amount,
  currency,
  status,
  description
) VALUES (
  'user-id-here',
  (SELECT id FROM wallets WHERE user_id = 'user-id-here'),
  'credit',
  100.00,
  'USD',
  'completed',
  'Manual balance adjustment by admin'
);
```

---

## 🔒 Row Level Security (RLS)

Both tables have RLS enabled:

**Wallets RLS:**
```sql
-- Users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own wallet (via service)
CREATE POLICY "Service can update wallets" ON wallets
  FOR UPDATE USING (true);
```

**Transactions RLS:**
```sql
-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service can create transactions
CREATE POLICY "Service can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);
```

---

## 📊 Useful Queries

### Get total revenue:
```sql
SELECT
  currency,
  SUM(amount) as total_revenue
FROM transactions
WHERE type = 'credit'
AND status = 'completed'
AND stripe_checkout_session_id IS NOT NULL
GROUP BY currency;
```

### Get users with highest balance:
```sql
SELECT
  user_id,
  balance_usd,
  balance_inr
FROM wallets
ORDER BY balance_usd DESC
LIMIT 10;
```

### Get failed transactions:
```sql
SELECT
  user_id,
  amount,
  currency,
  description,
  created_at
FROM transactions
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## 🎯 Summary

**Key Points:**
- `wallets` table stores user balances (USD, INR)
- `transactions` table records all payment activity
- Webhooks automatically update balances
- RLS ensures users only see their own data
- Frontend APIs fetch data from these tables

**Access Your Data:**
- Supabase Dashboard → Table Editor
- Or use SQL Editor for custom queries
- Or check via API routes: `/api/wallet/balance`, `/api/wallet/transactions`

Your wallet system is now fully integrated with the database! 🎉
