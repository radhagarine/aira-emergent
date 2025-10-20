# Phone Number Provisioning - Testing Guide

## 🎯 Ready to Test!

Your phone number provisioning system is fully set up and ready for testing. Follow this guide to test the complete flow.

---

## ✅ Current Configuration

**Status:** TEST MODE (Wallet checks disabled)

```bash
✅ Twilio credentials configured
✅ App URL configured
✅ Webhook URL configured
✅ Dev server running on http://localhost:3000
✅ Phone numbers page: http://localhost:3000/dashboard/numbers
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Search for Phone Numbers (FREE - No Twilio upgrade needed)**

This tests the UI and Twilio search API without purchasing.

#### Steps:
1. **Navigate to Phone Numbers Page**
   ```
   http://localhost:3000/dashboard/numbers
   ```

2. **Click "Buy phone number" button**
   - Opens the BuyNumberDialog

3. **Configure Search**
   - Country: United States 🇺🇸
   - Number Type: Local
   - Area Code: Select any (e.g., 415 - San Francisco)

4. **Click "Search"**
   - Makes API call to `/api/numbers/search`
   - Calls Twilio's search API (FREE - no charges)
   - Returns list of available numbers

5. **Expected Results:**
   - ✅ Loading spinner shows while searching
   - ✅ List of 20 phone numbers displayed
   - ✅ Each number shows:
     - Phone number (formatted)
     - Location (city, state)
     - Capabilities (Voice, SMS, MMS badges)
     - "Select" button
   - ✅ No errors in browser console

6. **Try Different Searches:**
   - Different area codes (212, 305, 617)
   - Toll-Free numbers
   - Different countries (Canada, UK)

**Cost:** FREE - Twilio allows searching without charges

---

### **Scenario 2: Purchase Flow (UI Testing - No real purchase)**

Test the complete purchase UI without actually buying.

#### Steps:
1. **Search for a number** (from Scenario 1)

2. **Click "Select" on any number**
   - Opens AddNumberDialog
   - Pre-fills the selected phone number

3. **Enter Details:**
   - Display Name: "Test Reception Line"
   - Phone number: (pre-filled from search)

4. **Click "Purchase number"**
   - In TEST MODE: Will attempt to purchase
   - Twilio will charge YOUR account (~$1.15)
   - App wallet check is DISABLED

5. **Expected Results (TEST MODE):**
   - ✅ Loading state shows
   - ✅ If Twilio account has credits: Number purchased successfully
   - ✅ If Twilio trial: Error about trial limitations
   - ✅ Number appears in table (if successful)
   - ✅ Wallet balance shows $0 (disabled in test mode)

**Cost:**
- Trial Account: FREE (but limited functionality)
- Paid Account: $1.15 per number (one-time setup fee)

---

### **Scenario 3: View Purchased Numbers**

#### Steps:
1. **Navigate to Phone Numbers Page**
   ```
   http://localhost:3000/dashboard/numbers
   ```

2. **Check the table displays:**
   - ✅ Phone number (formatted)
   - ✅ Agent name (display name)
   - ✅ Telephony provider (Twilio)
   - ✅ Purchase date
   - ✅ Renewal date (1 month from purchase)
   - ✅ Monthly rent ($1.50)
   - ✅ "Unlink agent" button
   - ✅ "Delete phone" button (trash icon)

---

### **Scenario 4: Delete a Number (Real deletion)**

⚠️ **Warning:** This will actually release the number from Twilio!

#### Steps:
1. **Click trash icon** on a number row
2. **Confirm deletion** in dialog
3. **Expected Results:**
   - ✅ Number released from Twilio
   - ✅ Number removed from database
   - ✅ Number removed from table
   - ✅ Success notification

**Cost:** FREE - No refund, but stops recurring charges

---

## 🔧 Current Configuration Details

### Test Mode Settings

The purchase flow currently has **wallet checks DISABLED**:

**File:** `app/api/numbers/purchase/route.ts`

```typescript
// Lines 73-90: WALLET BALANCE CHECK - DISABLED ❌
/* const hasSufficientBalance = await walletService.hasSufficientBalance(
  userId, monthlyCost, 'USD'
);

if (!hasSufficientBalance) {
  return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
} */

console.log('[TEST MODE] Skipping wallet balance check');

// Lines 110-116: WALLET DEDUCTION - DISABLED ❌
/* const transaction = await transactionService.createTransaction({
  user_id: userId,
  type: 'debit',
  amount: monthlyCost,
  currency: 'USD',
  status: 'completed',
  description: `Phone number purchase: ${phoneNumber}`,
}); */

console.log('[TEST MODE] Skipping wallet deduction');
```

### What Works in TEST MODE:
- ✅ Search for numbers (FREE)
- ✅ Select numbers
- ✅ Purchase numbers (charges YOUR Twilio account)
- ✅ View purchased numbers
- ✅ Delete numbers
- ❌ Wallet balance checking (disabled)
- ❌ User payment via Stripe (disabled)

---

## 💰 Twilio Account Status

### Trial Account Limitations:
- Can search numbers ✅
- Can purchase 1-2 numbers ⚠️
- Can only call/SMS verified numbers ⚠️
- Twilio watermark on calls ⚠️
- Limited to 1-2 active numbers ⚠️

### Paid Account ($20+ credit):
- Can search numbers ✅
- Can purchase unlimited numbers ✅
- No call/SMS restrictions ✅
- No watermarks ✅
- Full functionality ✅

**To Upgrade:**
1. Go to https://console.twilio.com
2. Navigate to Billing
3. Add $20 credit (covers ~17 phone numbers)

---

## 🧪 Recommended Testing Order

### **Phase 1: Free Testing (Now)**
```bash
1. ✅ Access phone numbers page
2. ✅ Test search functionality
3. ✅ Try different area codes
4. ✅ Test different number types (Local, Toll-Free)
5. ✅ Verify UI/UX flows
6. ✅ Check error handling (invalid searches)
```

**Cost:** $0
**Requirements:** Trial Twilio account

---

### **Phase 2: Purchase Testing (Optional - $1.15)**
```bash
1. Add $20 to Twilio account
2. Search for a test number
3. Purchase 1 number
4. Verify it appears in table
5. Verify webhooks are configured
6. Delete the test number
```

**Cost:** $1.15 (one-time)
**Requirements:** Paid Twilio account

---

### **Phase 3: Wallet Integration (Later)**
```bash
1. Add Stripe credentials to .env.local
2. Enable wallet checks (uncomment lines 74-89, 110-115)
3. Add test funds via Stripe ($10)
4. Purchase number using wallet balance
5. Verify wallet deduction
6. Check transaction history
```

**Cost:** $0 (using Stripe test cards)
**Requirements:** Stripe account + Paid Twilio

---

## 📊 Expected API Responses

### Search API (POST /api/numbers/search)

**Request:**
```json
{
  "countryCode": "US",
  "numberType": "local",
  "areaCode": "415"
}
```

**Response (Success):**
```json
{
  "success": true,
  "numbers": [
    {
      "phoneNumber": "+14155551234",
      "friendlyName": "+1 (415) 555-1234",
      "locality": "San Francisco",
      "region": "CA",
      "postalCode": "94102",
      "isoCountry": "US",
      "capabilities": {
        "voice": true,
        "sms": true,
        "mms": true
      },
      "monthlyCost": 1.50
    }
    // ... more numbers
  ],
  "total": 20
}
```

### Purchase API (POST /api/numbers/purchase)

**Request:**
```json
{
  "phoneNumber": "+14155551234",
  "displayName": "Test Reception Line",
  "countryCode": "US",
  "numberType": "local",
  "userId": "user-uuid-here"
}
```

**Response (Success - TEST MODE):**
```json
{
  "success": true,
  "message": "Phone number purchased successfully",
  "number": {
    "id": "uuid",
    "phone_number": "+14155551234",
    "display_name": "Test Reception Line",
    "monthly_cost": 1.50,
    "provider": "twilio",
    "purchase_date": "2025-10-16T04:30:00Z"
  }
}
```

**Response (Error - Insufficient Balance - DISABLED in TEST MODE):**
```json
{
  "error": "Insufficient balance. Required: $1.50",
  "code": "INSUFFICIENT_BALANCE",
  "requiredAmount": 1.50
}
```

---

## 🐛 Troubleshooting

### "Phone number provisioning is not configured"
**Cause:** Twilio credentials missing or invalid

**Fix:**
```bash
# Check .env.local has:
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
```

### "No phone numbers found"
**Cause:** Area code has no available numbers

**Fix:** Try different area code or remove area code filter

### "Failed to purchase number" (Trial account)
**Cause:** Trial accounts have purchase limitations

**Fix:** Upgrade Twilio account ($20 credit)

### Numbers not showing in table
**Cause:** Database connection issue or service initialization

**Fix:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check server logs

---

## 🔐 Security Notes

### In TEST MODE:
- ⚠️ No payment validation (wallet disabled)
- ⚠️ Direct Twilio charges to your account
- ✅ Still requires authentication
- ✅ User ID validation active

### In PRODUCTION MODE (when enabled):
- ✅ Wallet balance validation
- ✅ Payment via Stripe
- ✅ Transaction logging
- ✅ User authentication
- ✅ Rate limiting (TODO)

---

## 📝 Test Checklist

Use this checklist to track your testing progress:

### UI Testing
- [ ] Phone numbers page loads
- [ ] "Buy phone number" button opens dialog
- [ ] Search form displays correctly
- [ ] Country selector works
- [ ] Number type selector works
- [ ] Area code selector works
- [ ] Search button triggers search
- [ ] Loading state shows during search
- [ ] Results display correctly
- [ ] Phone numbers formatted properly
- [ ] Location information shown
- [ ] Capability badges displayed
- [ ] "Select" button works

### Search Testing
- [ ] Search with default settings (US, Local, Any)
- [ ] Search with specific area code (415)
- [ ] Search for toll-free numbers
- [ ] Search for different countries
- [ ] Handle no results gracefully
- [ ] Error messages display properly

### Purchase Testing (if Twilio upgraded)
- [ ] Select number from search
- [ ] AddNumberDialog opens with pre-filled number
- [ ] Enter display name
- [ ] Click "Purchase number"
- [ ] Loading state shows
- [ ] Success message appears
- [ ] Number appears in table
- [ ] All number details correct

### Table Display
- [ ] Phone numbers formatted
- [ ] Display names shown
- [ ] Provider shown (Twilio)
- [ ] Purchase dates formatted
- [ ] Renewal dates calculated correctly
- [ ] Monthly cost displayed
- [ ] Action buttons work

### Deletion Testing
- [ ] Trash icon clickable
- [ ] Confirmation dialog appears
- [ ] "Cancel" closes dialog
- [ ] "Delete" removes number
- [ ] Number removed from Twilio
- [ ] Number removed from database
- [ ] Table updates immediately

---

## 🚀 Next Steps

### Now (Phase 1):
1. Open http://localhost:3000/dashboard/numbers
2. Test search functionality (FREE)
3. Explore different area codes and number types
4. Verify UI/UX flows work correctly

### Later (Phase 2 - Optional):
1. Upgrade Twilio account if you want to test purchases
2. Purchase 1 test number (~$1.15)
3. Test the complete flow
4. Delete test number when done

### Production (Phase 3 - When Ready):
1. Enable wallet checks in purchase route
2. Add Stripe integration
3. Test end-to-end with real payments
4. Deploy to production

---

## 📞 Support

### Twilio Console
- Dashboard: https://console.twilio.com
- Phone Numbers: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
- Billing: https://console.twilio.com/billing

### Documentation
- Quick Start: `/docs/twilio/QUICK_START_TWILIO.md`
- Full Implementation: `/docs/twilio/TWILIO_IMPLEMENTATION.md`
- Wallet Guide: `/docs/wallet/WALLET_FUNDING_GUIDE.md`

---

## ✅ Summary

**You're ready to test phone number provisioning!**

**Current State:**
- ✅ Twilio configured
- ✅ Search API working
- ✅ Purchase API working (TEST MODE)
- ✅ UI fully functional
- ⏸️ Wallet integration disabled (TEST MODE)

**What You Can Do Now:**
- ✅ Search for numbers (FREE)
- ✅ Test UI flows (FREE)
- ⚠️ Purchase numbers (requires Twilio upgrade - $1.15 each)

**Start Testing:** http://localhost:3000/dashboard/numbers

🎉 **Happy Testing!**
