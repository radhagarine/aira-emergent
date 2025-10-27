# Twilio Testing Mode

This document explains how to safely test Twilio phone number features without spending money.

## Overview

The Twilio service has a **Testing Mode** that allows you to test the entire phone number purchase and release flow without making real API calls or being charged.

## Quick Start

### Enable Testing Mode (Default - SAFE)

Testing mode is **ENABLED BY DEFAULT** for safety. No configuration needed!

```bash
# Testing mode is already active
npm run dev
```

You'll see this banner on startup:
```
╔════════════════════════════════════════════════════════════════╗
║  TWILIO TESTING MODE ENABLED                                   ║
║  All Twilio API calls are MOCKED - No charges will be applied ║
║  To enable production mode, set TWILIO_TESTING_MODE=false      ║
╚════════════════════════════════════════════════════════════════╝
```

### Enable Production Mode (CHARGES MONEY)

**⚠️ WARNING: This will make REAL Twilio API calls and CHARGE YOUR ACCOUNT**

**Option 1: Environment Variable (Recommended)**

Add to `.env.local`:
```bash
TWILIO_TESTING_MODE=false
```

**Option 2: Code Configuration**

Edit `/lib/services/twilio/twilio.config.ts`:
```typescript
export const TwilioConfig = {
  TESTING_MODE: false, // Change from true to false
  // ...
}
```

You'll see this warning banner:
```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  TWILIO PRODUCTION MODE ENABLED  ⚠️                        ║
║  Real Twilio API calls - CHARGES WILL BE APPLIED              ║
║  To enable testing mode, set TWILIO_TESTING_MODE=true         ║
╚════════════════════════════════════════════════════════════════╝
```

## What Gets Mocked in Testing Mode?

### ✅ Mocked Operations (Safe - No Charges)

1. **Purchase Number**
   - No API call to Twilio
   - Generates fake Twilio SID (e.g., `PNABC123XYZ456DEF789`)
   - Creates real database record
   - No money charged

2. **Release Number**
   - No API call to Twilio
   - Updates database only
   - Number not actually deleted from Twilio

### ❌ NOT Mocked (Still Real API Calls)

1. **Search Available Numbers**
   - Makes real Twilio API call
   - This is FREE and doesn't charge your account
   - Needed to get real available numbers for testing

## Testing the Purchase Flow

### Step 1: Search for Numbers (Real API)
```
1. Go to Dashboard → Numbers
2. Click "Add Number"
3. Search for available numbers (uses real Twilio API, FREE)
4. Select a number
```

### Step 2: Purchase Number (Mocked)
```
1. Enter display name
2. Click "Purchase number"
3. ✅ Database record created
4. ✅ Fake Twilio SID generated
5. ✅ NO MONEY CHARGED
6. ✅ Number appears in your dashboard
```

**Console Output:**
```
┌─────────────────────────────────────────────────────────┐
│ 🧪 MOCK PURCHASE - NO REAL API CALL                    │
├─────────────────────────────────────────────────────────┤
│ Phone Number: +12136983534                              │
│ Display Name: Customer Support Line                     │
│ Status: ✅ SUCCESS (simulated)                          │
└─────────────────────────────────────────────────────────┘
[MOCK] Generated fake SID: PNABC123XYZ456DEF789
```

### Step 3: Release Number (Mocked)
```
1. Select a number
2. Click "Release"
3. ✅ Database record updated
4. ✅ NO REAL TWILIO DELETION
5. ✅ Your Twilio account unchanged
```

**Console Output:**
```
┌─────────────────────────────────────────────────────────┐
│ 🧪 MOCK RELEASE - NO REAL API CALL                     │
├─────────────────────────────────────────────────────────┤
│ Twilio SID: PNABC123XYZ456DEF789                        │
│ Status: ✅ SUCCESS (simulated)                          │
└─────────────────────────────────────────────────────────┘
[MOCK] Number PNABC123XYZ456DEF789 would have been released
```

## Testing the New DB-First Purchase Flow

The new purchase flow prevents money loss by creating the database record BEFORE calling Twilio:

### Testing Mode Flow:
```
1. Create DB record (pending, is_active=false) ✅
2. Mock Twilio purchase (no charge) ✅
3. Update DB record (is_active=true) ✅
4. Success! Number in database with fake SID
```

### Production Mode Flow:
```
1. Create DB record (pending, is_active=false) ✅
2. Real Twilio purchase (MONEY CHARGED HERE) 💰
3. Update DB record (is_active=true) ✅
4. If step 3 fails: Number stays in DB as pending + kept in Twilio
```

## Files Structure

```
lib/services/twilio/
├── twilio.config.ts          # Feature flag configuration
├── twilio.mocks.ts            # Mock response generators
├── twilio-numbers.service.ts  # Main service (uses config)
└── types.ts                   # TypeScript types
```

## Configuration File

**`lib/services/twilio/twilio.config.ts`**

```typescript
export const TwilioConfig = {
  // Set to true for testing (default), false for production
  TESTING_MODE: process.env.TWILIO_TESTING_MODE === 'true' || true,

  isTestingMode(): boolean {
    return this.TESTING_MODE;
  },

  isProductionMode(): boolean {
    return !this.TESTING_MODE;
  },
};
```

## How to Switch Modes

### Method 1: Environment Variable (Recommended)

**.env.local**
```bash
# Testing mode (safe)
TWILIO_TESTING_MODE=true

# Production mode (charges money)
TWILIO_TESTING_MODE=false
```

### Method 2: Direct Code Change

**lib/services/twilio/twilio.config.ts**
```typescript
export const TwilioConfig = {
  // Change this line:
  TESTING_MODE: false, // true = testing, false = production
};
```

## Safety Checklist

Before enabling production mode, verify:

- [ ] RLS policies are correctly configured in Supabase
- [ ] Database schema is up to date
- [ ] Twilio credentials are correct in `.env.local`
- [ ] You have sufficient balance in Twilio account
- [ ] You understand that **charges will be applied**
- [ ] You've tested the full flow in testing mode first

## Troubleshooting

### "How do I know which mode I'm in?"

Check the server startup logs for the banner message:
- 🧪 Green banner = Testing mode (safe)
- ⚠️ Red banner = Production mode (charges apply)

### "I want to test with real numbers but not purchase them"

Use testing mode! The search function still uses real Twilio API (FREE), so you'll see real available numbers. You just won't actually purchase them.

### "I accidentally left production mode on"

Don't panic! The code now has additional safeguards:
1. Database record created FIRST before Twilio purchase
2. If DB fails, no money charged
3. Console warnings show "⚠️ PRODUCTION MODE" before each API call

### "Can I test RLS policies in testing mode?"

Yes! Testing mode only mocks the Twilio API calls. All database operations are real, so you can test:
- RLS policies
- Database inserts/updates
- Data validation
- UI behavior

## Production Deployment

When deploying to production:

1. **Set environment variable:**
   ```bash
   TWILIO_TESTING_MODE=false
   ```

2. **Verify on startup** - Check logs for production mode banner

3. **Monitor first purchase** - Watch logs carefully for any issues

4. **Verify in Twilio dashboard** - Confirm number appears in your Twilio account

## Support

If you encounter issues:
1. Check the console logs for `[MOCK]` or `[PRODUCTION]` prefixes
2. Verify the startup banner shows the correct mode
3. Review RLS policies if database operations fail
4. Check Twilio dashboard for account balance and credentials


==================================

Detailed Steps to Test Phone Number Purchase in Production Mode

  Prerequisites Checklist

  Before switching to production mode, verify:

  1. Twilio Account Requirements:
  - Active Twilio account with sufficient balance ($1+ per local number)
  - Valid TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env.local
  - Account is not in trial mode (or understand trial limitations)

  2. Application Requirements:
  - Supabase RLS policies are correctly configured
  - Database schema is up to date with latest migrations
  - You have a valid user account to test with
  - Wallet system is functional and you have test balance

  3. Environment Setup:
  - .env.local file contains all required variables
  - Webhook URLs are accessible (if testing webhooks)

  ---
  Step 1: Verify Current Configuration

  Check your current testing mode status:

  # Check if TWILIO_TESTING_MODE is set in .env.local
  cat .env.local | grep TWILIO_TESTING_MODE

  If not present, testing mode is enabled by default (safe).

  ---
  Step 2: Enable Production Mode

  Option A: Environment Variable (Recommended)

  Edit your .env.local file:

  # Add this line to .env.local
  TWILIO_TESTING_MODE=false

  Option B: Code Configuration

  Edit /Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui/lib/services/twilio/twilio.config.ts:

  export const TwilioConfig = {
    TESTING_MODE: false, // Change from default to false
    // ...
  }

  ---
  Step 3: Verify Environment Variables

  Ensure your .env.local has these Twilio credentials:

  TWILIO_ACCOUNT_SID=your_actual_account_sid
  TWILIO_AUTH_TOKEN=your_actual_auth_token
  TWILIO_TESTING_MODE=false  # PRODUCTION MODE

  # Optional but recommended
  TWILIO_WEBHOOK_URL=https://your-domain.com

  ---
  Step 4: Restart the Development Server

  # Stop current server (Ctrl+C)
  npm run dev

  Verify the startup banner shows:
  ⚠️ TWILIO PRODUCTION MODE ENABLED - Real API calls will be made

  If you see the testing mode banner instead, go back to Step 2.

  ---
  Step 5: Prepare for Testing

  Important financial notes:
  - Each local number costs approximately $1.00/month (US)
  - Toll-free numbers cost approximately $2.00/month
  - Twilio will charge your account immediately
  - The charge is for the first month of service

  Prepare:
  1. Have your Twilio dashboard open: https://console.twilio.com/
  2. Note your current account balance
  3. Have a pen/paper ready to document the test

  ---
  Step 6: Execute Test Purchase Flow

  6.1: Search for Available Numbers
  1. Log into your application
  2. Navigate to Dashboard → Numbers
  3. Click "Add Number" or similar button
  4. Search for available numbers:
     - Country: US (or your target country)
     - Number Type: Local (cheapest option)
     - Area Code: (optional, e.g., 213 for LA)
  5. Click "Search"

  What happens: Real Twilio API call (FREE - no charge for searching)

  ---
  6.2: Select a Number
  1. Review the search results
  2. Select a specific phone number (e.g., +1-213-XXX-XXXX)
  3. Note the phone number for your records

  ---
  6.3: Purchase the Number ⚠️ MONEY WILL BE CHARGED HERE
  1. Enter display name (e.g., "Test Line 1")
  2. Review the monthly cost (should show $1.00 for local US numbers)
  3. Click "Purchase Number" button
  4. WAIT for the operation to complete (may take 5-10 seconds)

  What happens in the backend:

  Step 1: Check wallet balance ✓
  Step 2: Check for duplicate phone number ✓
  Step 3: Create database record (pending, is_active=false) ✓
  Step 4: TWILIO API CALL - PURCHASE NUMBER 💰 (MONEY CHARGED HERE)
  Step 5: Update database record (is_active=true, twilio_sid=PN...) ✓
  Step 6: Deduct from wallet ✓
  Step 7: Create transaction record ✓

  ---
  6.4: Monitor the Console Output

  Watch your terminal for these logs:

  ⚠️ PRODUCTION MODE: Making REAL Twilio API call - charges will apply
  ✅ Twilio purchase successful. SID: PNxxxxxxxxxxxxxxxxxxxx

  Red flags to watch for:
  - Any error mentioning "20404" = Number no longer available
  - Any error mentioning "21608" = Insufficient Twilio balance
  - Any error mentioning "21452" = Address/Bundle required

  ---
  Step 7: Verify the Purchase

  7.1: In Your Application
  1. The number should appear in your Numbers dashboard
  2. Status should show as "Active"
  3. The Twilio SID should be visible (starts with "PN")

  7.2: In Twilio Console
  1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
  2. Find your newly purchased number
  3. Verify it shows:
     - Phone number matches what you purchased
     - Status: Active
     - Voice webhook configured
     - SMS webhook configured

  7.3: Check Your Balance
  1. In Twilio Console, check account balance
  2. Verify amount was deducted (~$1.00 for local number)
  3. In your application, check wallet balance decreased

  ---
  Step 8: Test Number Functionality (Optional)

  8.1: Test Incoming Call
  1. Call the purchased number from your mobile phone
  2. Check if webhook receives the call (check server logs)
  3. Expected behavior depends on your voice agent configuration

  8.2: Test SMS
  1. Send an SMS to the purchased number
  2. Check if webhook receives the message (check server logs)

  ---
  Step 9: Test Release Flow (Optional)

  ⚠️ WARNING: This will actually delete the number from Twilio

  1. In your Numbers dashboard, select the test number
  2. Click "Release" or "Delete"
  3. Confirm the action
  4. Wait for operation to complete

  What happens:
  Step 1: Validate user owns the number ✓
  Step 2: Create refund transaction ✓
  Step 3: TWILIO API CALL - DELETE NUMBER (actually deletes from Twilio)
  Step 4: Update database (is_active=false, released_date=now) ✓

  Verify in Twilio Console:
  - Number should be removed from your active numbers list
  - May take a few minutes to reflect

  ---
  Step 10: Return to Testing Mode

  After testing, switch back to safe mode:

  # Edit .env.local
  TWILIO_TESTING_MODE=true  # or remove this line entirely

  Restart server:
  npm run dev

  Verify you see:
  🔧 TWILIO TESTING MODE ENABLED - All API calls are MOCKED

  ---
  Important Production Notes

  Financial Protection Features

  Your code has these safeguards (app/api/numbers/purchase/route.ts:106-195):

  1. Wallet balance check - Prevents purchase if insufficient funds
  2. Duplicate check - Prevents buying the same number twice
  3. Database-first approach - Creates DB record BEFORE Twilio call
  4. Atomic operations - Wallet deduction uses database-level atomicity
  5. Comprehensive error handling - Prevents money loss if errors occur

  What Gets Charged

  According to Twilio pricing:
  - Local numbers: ~$1.00/month (US)
  - Toll-free numbers: ~$2.00/month (US)
  - International numbers: Varies by country
  - Setup fee: None for most numbers
  - Usage fees: Separate charges for calls/SMS (not covered in monthly cost)

  Error Scenarios to Test

  1. Insufficient wallet balance: Try purchasing without enough funds
  2. Number no longer available: Purchase a popular number that gets taken
  3. Duplicate purchase: Try buying the same number twice
  4. Network interruption: Kill the request mid-purchase (tests rollback)

  Monitoring and Logs

  Files to monitor: lib/services/twilio/twilio-numbers.service.ts:120-136

  Watch for these log patterns:
  - ⚠️ PRODUCTION MODE: - Real API call starting
  - ✅ Twilio purchase successful - Purchase completed
  - CRITICAL: - Manual intervention needed

  ---
  Rollback Plan

  If something goes wrong:

  1. Check database - Look for records with is_active=false and notes about failures
  2. Check Twilio Console - Manually verify which numbers are active
  3. Manual reconciliation - Match DB records to actual Twilio numbers
  4. Release orphaned numbers - Delete from Twilio if not in DB

  ---


  ---
  🎯 Flow Chart

  Start Purchase
      ↓
  Check Wallet Balance
      ↓ (sufficient)
  Check Duplicate Number
      ↓ (available)
  Create Pending DB Record (is_active=false)
      ↓
  ┌─────────────────────────┐
  │ TWILIO PURCHASE ATTEMPT │
  └─────────────────────────┘
           ↓
      ┌────┴────┐
      ↓         ↓
    FAIL     SUCCESS
      ↓         ↓
  Delete DB  Update DB (is_active=true)
  Record        ↓
      ↓      Deduct Wallet ← ONLY HERE!
      ↓         ↓
      ↓      Create Transaction
      ↓         ↓
  Return    Return Success
  Error

  ---
  ✅ Scenario Analysis

  Scenario 1: Twilio Purchase Fails

  Example: Number no longer available (Twilio error 20404)

  | Step  | Action                  | Wallet Balance | DB State                           |
  |-------|-------------------------|----------------|------------------------------------|
  | Start | User has $10.00         | $10.00         | Empty                              |
  | 1     | Check balance           | $10.00         | Empty                              |
  | 2     | Check duplicate         | $10.00         | Empty                              |
  | 3     | Create pending record   | $10.00         | 1 pending record (is_active=false) |
  | 4     | Twilio fails ❌          | $10.00         | Pending record deleted             |
  | 5     | Deduct wallet (skipped) | $10.00         | Empty                              |
  | End   | Return error            | $10.00 ✅       | Empty ✅                            |

  Result: ✅ Wallet unchanged! User keeps their $10.00

  ---
  Scenario 2: Twilio Succeeds, Wallet Deduction Fails

  Example: Database connection error during wallet update

  | Step  | Action                   | Wallet Balance | DB State                          |
  |-------|--------------------------|----------------|-----------------------------------|
  | Start | User has $10.00          | $10.00         | Empty                             |
  | 1-3   | Checks + pending record  | $10.00         | 1 pending record                  |
  | 4     | Twilio succeeds ✅        | $10.00         | Updated with Twilio SID           |
  | 5     | Wallet deduction fails ❌ | $10.00         | Number marked inactive with notes |
  | End   | Return error             | $10.00 ✅       | Number saved, needs admin fix ⚠️  |

  Result:
  - ✅ Wallet unchanged (no deduction)
  - ⚠️ Number purchased from Twilio (money already charged by Twilio)
  - ⚠️ Number in DB marked as inactive with CRITICAL notes
  - ⚠️ User gets error: "Please contact support with reference ID: {pendingNumberId}"

  See: route.ts:224-252 for this exact scenario handling

  ---
  Scenario 3: Everything Succeeds

  | Step  | Action                  | Wallet Balance | DB State                                 |
  |-------|-------------------------|----------------|------------------------------------------|
  | Start | User has $10.00         | $10.00         | Empty                                    |
  | 1-3   | Checks + pending record | $10.00         | 1 pending record                         |
  | 4     | Twilio succeeds ✅       | $10.00         | Updated with Twilio SID (is_active=true) |
  | 5     | Wallet deducted ✅       | $9.00          | Active number                            |
  | 6     | Transaction created ✅   | $9.00          | Active number + transaction              |
  | End   | Return success          | $9.00 ✅        | Complete ✅                               |

  ---
  🔒 Why This Design is Safe

  Key Safety Features:

  1. Database-First Approach (route.ts:142-164)
    - Creates DB record BEFORE Twilio call
    - If Twilio fails, we can clean up
    - No orphaned Twilio numbers
  2. Wallet Deduction AFTER Twilio (route.ts:206)
    - Only deducts if Twilio succeeds
    - If Twilio fails, wallet untouched
    - No double-charging risk
  3. Try-Catch Protection (route.ts:166-190)
    - Catches Twilio failures
    - Cleans up pending DB record
    - Throws error before wallet deduction
  4. Error Propagation (route.ts:189)
    - throw twilioError stops execution
    - Wallet deduction code never reached
    - User gets clear error message

  ---
  🚨 Common Twilio Failure Scenarios

  Here are real Twilio errors that would NOT deduct your wallet:

  | Twilio Error                | Code  | Meaning                    | Wallet Deducted? |
  |-----------------------------|-------|----------------------------|------------------|
  | Number unavailable          | 20404 | Someone else bought it     | ❌ NO             |
  | Insufficient Twilio balance | 21608 | Not enough money in Twilio | ❌ NO             |
  | Auth failed                 | 20003 | Invalid credentials        | ❌ NO             |
  | Address required            | 21452 | Need regulatory bundle     | ❌ NO             |
  | Rate limit                  | 20429 | Too many requests          | ❌ NO             |
  | Network timeout             | N/A   | Connection failed          | ❌ NO             |

  In ALL cases above, wallet deduction is skipped!

  ---
  ✅ Summary

  Your question: "What if Twilio purchase fails? Does it still deduct from wallet?"

  Answer: NO! ✅

  Why?
  - Wallet deduction is in Step 5 (route.ts:209)
  - Twilio purchase is in Step 4 (route.ts:167)
  - If Step 4 fails, code throws error and exits
  - Step 5 is never reached
  - Wallet remains unchanged

  Protection layers:
  1. ✅ Try-catch around Twilio call
  2. ✅ Error thrown before wallet deduction
  3. ✅ Pending DB record cleaned up
  4. ✅ User gets clear error message
  5. ✅ No money deducted from either wallet or Twilio

  This is excellent defensive programming! 🎉

  The only edge case is if Twilio succeeds but wallet deduction fails - in that case, the number is kept in DB with inactive status and
  admin notes for manual resolution (which is the correct behavior since Twilio already charged you).

  ----------


  📊 Database Verification Checklist After Purchase

  Once you complete the purchase, you'll need to verify entries in 3 database tables. Here's exactly what to check:

  ---
  1️⃣ Table: business_numbers

  This table should have ONE new row for your purchased number.

  SQL Query to Run:

  -- Find your newly purchased number
  SELECT
    id,
    user_id,
    business_id,
    phone_number,
    display_name,
    country_code,
    number_type,
    provider,
    is_active,
    is_primary,
    twilio_sid,
    twilio_account_sid,
    voice_url,
    sms_url,
    status_callback_url,
    capabilities,
    features,
    monthly_cost,
    purchase_date,
    notes,
    created_at,
    updated_at
  FROM business_numbers
  ORDER BY created_at DESC
  LIMIT 1;

  ✅ Expected Values:

  | Field               | Expected Value                                           | Why Important                                       |
  |---------------------|----------------------------------------------------------|-----------------------------------------------------|
  | id                  | UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)        | Unique identifier                                   |
  | user_id             | Your user's UUID                                         | Should match logged-in user                         |
  | business_id         | NULL                                                     | Numbers purchased without business assignment       |
  | phone_number        | The number you purchased (e.g., +12136983534)            | Exact match                                         |
  | display_name        | Your entered name (e.g., "Production Test Line 1")       | What you typed                                      |
  | country_code        | "US"                                                     | For US numbers                                      |
  | number_type         | "local" or "toll_free"                                   | Type you selected                                   |
  | provider            | "twilio"                                                 | Always twilio                                       |
  | is_active           | true                                                     | ✅ CRITICAL - Must be true after successful purchase |
  | is_primary          | false                                                    | Should be false for new numbers                     |
  | twilio_sid          | "PN..." (30+ chars)                                      | ✅ CRITICAL - Real Twilio SID (starts with PN)       |
  | twilio_account_sid  | "AC874cb8082bc06194b84ba9607f586a3b"                     | Your Twilio account SID                             |
  | voice_url           | "https://...ngrok.../api/voice-agent/handle-call"        | Webhook URL                                         |
  | sms_url             | "https://...ngrok.../api/voice-agent/handle-sms"         | Webhook URL                                         |
  | status_callback_url | "https://...ngrok.../api/voice-agent/status"             | Webhook URL                                         |
  | capabilities        | {"sms": true, "voice": true, "mms": false, "fax": false} | Number capabilities                                 |
  | features            | ["sms", "voice"]                                         | Array of enabled features                           |
  | monthly_cost        | 1.00 or 2.00                                             | Monthly cost in USD                                 |
  | purchase_date       | Recent timestamp                                         | When purchased                                      |
  | notes               | NULL or empty                                            | No errors                                           |
  | created_at          | Recent timestamp                                         | Record creation time                                |
  | updated_at          | Recent timestamp (≈ created_at)                          | Should be updated after Twilio success              |

  🚨 Red Flags to Watch For:

  - ❌ is_active = false - Purchase failed or incomplete
  - ❌ twilio_sid is NULL - Twilio purchase didn't complete
  - ❌ twilio_sid starts with "MOCK_" or "PNABC123" - Testing mode was still active!
  - ❌ notes contains "PAYMENT PROCESSING FAILED" - Wallet deduction failed
  - ❌ Multiple rows with same phone_number - Duplicate issue

  ---
  2️⃣ Table: wallets

  Your wallet balance should be decreased by the monthly cost.

  SQL Query to Run:

  -- Check your wallet balance
  SELECT
    id,
    user_id,
    balance_usd,
    balance_inr,
    currency,
    is_active,
    updated_at
  FROM wallets
  WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with your actual user ID
  ORDER BY updated_at DESC
  LIMIT 1;

  ✅ Expected Values:

  | Field       | Expected Value                   | Why Important                  |
  |-------------|----------------------------------|--------------------------------|
  | user_id     | Your user's UUID                 | Matches logged-in user         |
  | balance_usd | Previous balance - monthly_cost  | ✅ CRITICAL - Should be reduced |
  | balance_inr | Unchanged (if using USD)         | Only USD should change         |
  | currency    | "USD"                            | Primary currency               |
  | is_active   | true                             | Wallet is active               |
  | updated_at  | Recent timestamp (purchase time) | ✅ CRITICAL - Should be updated |

  🚨 Red Flags to Watch For:

  - ❌ balance_usd unchanged - Wallet deduction failed
  - ❌ updated_at is old - Wallet not updated
  - ❌ balance_usd is negative - Constraint violation (should never happen!)

  📊 Calculate Expected Balance:

  Expected balance_usd = Previous balance - monthly_cost

  Example:
  Previous: $100.00
  Monthly cost: $1.00
  Expected: $99.00

  ---
  3️⃣ Table: transactions

  Should have ONE new transaction record for the purchase.

  SQL Query to Run:

  -- Find your purchase transaction
  SELECT
    id,
    user_id,
    wallet_id,
    type,
    amount,
    currency,
    description,
    status,
    payment_method,
    business_number_id,
    metadata,
    created_at,
    updated_at
  FROM transactions
  WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with your actual user ID
  ORDER BY created_at DESC
  LIMIT 1;

  ✅ Expected Values:

  | Field              | Expected Value               | Why Important                             |
  |--------------------|------------------------------|-------------------------------------------|
  | id                 | UUID                         | Transaction identifier                    |
  | user_id            | Your user's UUID             | Matches logged-in user                    |
  | wallet_id          | Your wallet's UUID           | Links to your wallet                      |
  | type               | "debit"                      | ✅ CRITICAL - Money deducted (not credit)  |
  | amount             | 1.00 or 2.00                 | Monthly cost amount                       |
  | currency           | "USD"                        | Transaction currency                      |
  | description        | Contains the phone number    | Should mention phone number purchased     |
  | status             | "completed"                  | ✅ CRITICAL - Must be completed            |
  | payment_method     | "twilio_purchase" or similar | Payment method identifier                 |
  | business_number_id | UUID of the purchased number | ✅ CRITICAL - Links to business_numbers.id |
  | metadata           | JSON object                  | May contain additional info               |
  | created_at         | Recent timestamp             | Transaction creation time                 |
  | updated_at         | Recent timestamp             | Should match created_at                   |

  🚨 Red Flags to Watch For:

  - ❌ type = "credit" - Wrong transaction type!
  - ❌ status = "pending" or "failed" - Transaction didn't complete
  - ❌ business_number_id is NULL - Not linked to phone number
  - ❌ amount doesn't match monthly_cost - Incorrect charge
  - ❌ No transaction found - Transaction creation failed

  ---
  🔗 Cross-Table Verification

  After checking individual tables, verify the relationships between them:

  Query to Join All Three Tables:

  -- Comprehensive verification query
  SELECT
    bn.id as number_id,
    bn.phone_number,
    bn.display_name,
    bn.is_active,
    bn.twilio_sid,
    bn.monthly_cost,
    bn.user_id,

    w.balance_usd as wallet_balance,
    w.updated_at as wallet_updated,

    t.id as transaction_id,
    t.type as transaction_type,
    t.amount as transaction_amount,
    t.status as transaction_status,
    t.description as transaction_description,

    bn.created_at as number_created,
    t.created_at as transaction_created

  FROM business_numbers bn
  LEFT JOIN wallets w ON w.user_id = bn.user_id
  LEFT JOIN transactions t ON t.business_number_id = bn.id

  WHERE bn.user_id = 'YOUR_USER_ID_HERE' -- Replace with your user ID
  ORDER BY bn.created_at DESC
  LIMIT 1;

  ✅ Expected Relationships:

  1. business_numbers.user_id = wallets.user_id ✅
  2. business_numbers.id = transactions.business_number_id ✅
  3. business_numbers.monthly_cost = transactions.amount ✅
  4. transactions.type = "debit" ✅
  5. transactions.status = "completed" ✅
  6. business_numbers.is_active = true ✅
  7. All timestamps are within seconds of each other ✅

  ---
  📋 Quick Verification Checklist

  After purchase, verify these 10 critical points:

  - business_numbers: Row exists with correct phone number
  - business_numbers.is_active: true
  - business_numbers.twilio_sid: Real SID (starts with "PN", not "MOCK")
  - business_numbers.user_id: Matches your user ID
  - wallets.balance_usd: Decreased by monthly_cost
  - wallets.updated_at: Recent timestamp
  - transactions: Row exists
  - transactions.type: "debit"
  - transactions.status: "completed"
  - transactions.business_number_id: Matches business_numbers.id