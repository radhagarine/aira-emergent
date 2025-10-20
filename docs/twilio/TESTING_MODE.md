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
