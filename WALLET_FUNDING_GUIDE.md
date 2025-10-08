# Wallet Funding System - Complete Guide

## ✅ Status: PRODUCTION READY

The wallet funding system is fully implemented and integrated with Stripe for secure payment processing.

---

## 📋 Overview

The wallet funding system allows users to add funds to their account balance using Stripe Checkout. These funds can then be used to:
- Purchase Twilio phone numbers
- Pay for monthly phone number rentals
- Pay for voice agent usage
- Other platform services

---

## 🏗️ Architecture

### Components

1. **Frontend (UI)**
   - `app/dashboard/funds/page.tsx` - Main funds page with Add Funds dialog
   - Currency selection (USD, INR)
   - Preset amounts ($10, $25, $50, $100, $250, $500)
   - Custom amount input
   - Transaction history display

2. **Backend API**
   - `app/api/payment/create-checkout-session/route.ts` - Creates Stripe Checkout session
   - `app/api/payment/webhook/route.ts` - Handles Stripe webhooks

3. **Services**
   - `lib/services/payment/stripe.service.ts` - Stripe integration wrapper
   - `lib/services/wallet/wallet.service.ts` - Wallet balance management
   - `lib/services/transaction/transaction.service.ts` - Transaction recording

4. **Database**
   - `wallets` table - Stores user balances (USD and INR)
   - `transactions` table - Records all transactions
   - Database triggers automatically update wallet balances

---

## 🔄 Payment Flow

### 1. **User Initiates Payment**
```
User clicks "Add Funds" → Selects amount & currency → Clicks "Confirm Payment"
```

### 2. **Create Checkout Session**
```typescript
POST /api/payment/create-checkout-session
{
  "amount": 50.00,
  "currency": "USD"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

### 3. **Redirect to Stripe**
User is redirected to Stripe Checkout page for secure payment.

### 4. **Payment Processing**
- User enters card details on Stripe's secure page
- Stripe processes the payment
- Stripe sends webhook event to our server

### 5. **Webhook Handler**
```
checkout.session.completed → Add funds to wallet
checkout.session.async_payment_succeeded → Add funds to wallet
checkout.session.async_payment_failed → Mark transaction as failed
payment_intent.payment_failed → Mark transaction as failed
```

### 6. **Funds Added**
- Transaction marked as completed
- Wallet balance updated
- User redirected back to funds page with success message

---

## 🎯 Features

### ✅ Implemented

1. **Multiple Payment Amounts**
   - Preset buttons: $10, $25, $50, $100, $250, $500
   - Custom amount input (any value ≥ $1)

2. **Multi-Currency Support**
   - USD ($)
   - INR (₹)

3. **Secure Payment Processing**
   - Stripe Checkout (PCI-compliant)
   - Webhook signature verification
   - Idempotency handling

4. **Transaction Management**
   - Pending transaction created before payment
   - Automatic status updates via webhooks
   - Complete transaction history
   - Failed payment tracking

5. **User Experience**
   - Loading states during payment
   - Success/cancel notifications
   - Real-time balance display
   - Transaction history with status badges

6. **Error Handling**
   - Authentication check
   - Amount validation
   - Payment service availability check
   - Graceful error messages
   - Rollback on failure

---

## 🔧 Setup Instructions

### Step 1: Get Stripe API Keys

1. Sign up at https://stripe.com
2. Go to **Developers → API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Set Up Webhook

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click "Add endpoint"
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/payment/webhook
   ```
   For local testing: Use ngrok
   ```bash
   ngrok http 3000
   # Use: https://xxxxx.ngrok.io/api/payment/webhook
   ```

4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`

5. Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 3: Configure Environment Variables

Add to `.env.local`:

```bash
# Stripe Configuration (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL (REQUIRED for redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 4: Test the Integration

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Use Stripe test cards:**
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   Requires Auth: 4000 0025 0000 3155

   Expiry: Any future date (e.g., 12/25)
   CVV: Any 3 digits (e.g., 123)
   ```

3. **Test the flow:**
   - Go to `/dashboard/funds`
   - Click "Add Funds"
   - Select amount and currency
   - Click "Confirm Payment"
   - Complete payment on Stripe
   - Verify redirect back with success message
   - Check wallet balance updated

### Step 5: Monitor Webhooks

View webhook logs in Stripe Dashboard:
```
Developers → Webhooks → [Your endpoint] → Logs
```

---

## 💰 Pricing & Fees

### Stripe Fees (as of 2025)
- **Domestic cards:** 2.9% + $0.30 per transaction
- **International cards:** 3.9% + $0.30 per transaction
- **Currency conversion:** Additional 1% fee

### Recommended Markup
Add 3-5% markup to cover Stripe fees and provide profit margin.

Example with $50 top-up:
```
User pays: $50.00
Stripe fee: $1.75 (2.9% + $0.30)
Net received: $48.25
Your markup (5%): $2.50
Final credit to user wallet: $50.00
```

### Minimum Amount
Recommended: $5 minimum to make fees proportional

---

## 🔐 Security

### ✅ Implemented Security Measures

1. **PCI Compliance**
   - Using Stripe Checkout (PCI-compliant)
   - Never handle card details directly
   - Card data never touches our servers

2. **Webhook Security**
   - Signature verification using `STRIPE_WEBHOOK_SECRET`
   - Prevents replay attacks
   - Ensures webhooks are from Stripe

3. **Authentication**
   - User must be authenticated to add funds
   - User ID from Supabase auth token
   - Row Level Security (RLS) on database

4. **Data Integrity**
   - Pending transaction created before payment
   - Atomic wallet updates
   - Transaction logs for audit trail

5. **Error Handling**
   - No sensitive data in error messages
   - Failed payments logged but not exposed
   - Graceful degradation if Stripe unavailable

---

## 📊 Database Schema

### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  balance_usd DECIMAL(10, 2) DEFAULT 0.00,
  balance_inr DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'credit' or 'debit'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL, -- 'USD' or 'INR'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  description TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🧪 Testing

### Test Cards (Stripe Test Mode)

```
✅ Success - Immediate:
4242 4242 4242 4242

❌ Card Declined:
4000 0000 0000 0002

⏳ Requires Authentication (3D Secure):
4000 0025 0000 3155

⏱️ Payment Succeeds After Delay:
4000 0000 0000 3220
```

### Test Scenarios

1. **Successful Payment**
   - Add $50 USD
   - Complete payment
   - Verify balance increased by $50
   - Check transaction marked as "completed"

2. **Canceled Payment**
   - Start payment flow
   - Click back/cancel on Stripe
   - Verify redirected with cancel message
   - Check transaction still "pending"

3. **Failed Payment**
   - Use declined card (4000 0000 0000 0002)
   - Verify error message shown
   - Check transaction marked as "failed"

4. **Currency Selection**
   - Add ₹500 INR
   - Verify INR balance updated (not USD)

5. **Custom Amount**
   - Enter $73.50
   - Verify custom amount accepted

---

## 🐛 Troubleshooting

### "Payment processing is currently unavailable"
**Cause:** `STRIPE_SECRET_KEY` not configured
**Fix:** Add Stripe secret key to `.env.local`

### Webhook not receiving events
**Causes:**
1. Webhook URL incorrect
2. Webhook secret mismatch
3. Events not selected

**Fix:**
1. Verify webhook URL in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` matches
3. Use ngrok for local testing
4. Check webhook logs in Stripe Dashboard

### Payment succeeds but balance not updated
**Causes:**
1. Webhook not configured
2. Webhook signature verification failing
3. Database error

**Debug:**
1. Check webhook logs in Stripe Dashboard
2. Check server logs for webhook errors
3. Verify database connection
4. Check transaction table for pending records

### "Invalid signature" webhook error
**Cause:** Wrong webhook secret
**Fix:**
1. Copy webhook signing secret from Stripe
2. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`
3. Restart server

---

## 📈 Production Checklist

Before going live:

- [ ] Switch to Stripe **live keys** (not test keys)
- [ ] Update webhook URL to production domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Test with real (low-amount) payment
- [ ] Set up Stripe alerts for failed payments
- [ ] Configure Stripe email notifications
- [ ] Set up monitoring for webhook failures
- [ ] Document refund process
- [ ] Set minimum/maximum amounts
- [ ] Add terms & conditions link
- [ ] Test currency conversion if supporting INR
- [ ] Configure Stripe Radar for fraud detection
- [ ] Set up backup webhook endpoint
- [ ] Test 3D Secure authentication flow

---

## 🔜 Future Enhancements

### Potential Features

1. **Payment Methods**
   - [ ] Save card for future use
   - [ ] Bank transfer/ACH
   - [ ] Digital wallets (Apple Pay, Google Pay)
   - [ ] Crypto payments

2. **User Experience**
   - [ ] Auto-refill when balance low
   - [ ] Subscription plans
   - [ ] Gift cards
   - [ ] Promotional credits

3. **Admin Features**
   - [ ] Manual balance adjustment
   - [ ] Refund management
   - [ ] Transaction export
   - [ ] Analytics dashboard

4. **Compliance**
   - [ ] Invoice generation
   - [ ] Tax handling
   - [ ] Receipt emails
   - [ ] Accounting integration

---

## 📞 Support

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Issues
For bugs or feature requests related to the wallet system, create an issue in the repository.

---

## ✅ Summary

The wallet funding system is **production-ready** with:

✅ Secure Stripe Checkout integration
✅ Multi-currency support (USD, INR)
✅ Webhook handling for automatic balance updates
✅ Complete transaction tracking
✅ Error handling and rollback
✅ User-friendly UI with loading states
✅ Success/cancel notifications
✅ Transaction history

**Next Steps:**
1. Add Stripe keys to `.env.local`
2. Test with Stripe test cards
3. Set up production webhook when ready to go live

🎉 **Ready to accept payments!**
