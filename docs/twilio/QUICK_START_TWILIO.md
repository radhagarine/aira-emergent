# 🚀 Quick Start: Twilio Phone Number Provisioning

## Get Up and Running in 5 Minutes

### Step 1: Database Migration (30 seconds)
```bash
npm run db:push
```

### Step 2: Add Twilio Credentials (1 minute)

Edit `.env.local` and add:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get credentials from:** https://console.twilio.com/

### Step 3: Start Development (1 minute)
```bash
npm run dev
```

### Step 4: Test It Out! (2 minutes)

1. **Add funds to your wallet:**
   - Go to http://localhost:3000/dashboard/funds
   - Add at least $5.00

2. **Buy a phone number:**
   - Go to http://localhost:3000/dashboard/numbers
   - Click "Buy phone number"
   - Select "United States" → "Local"
   - Enter area code: `415` (or your preferred area code)
   - Click "Search"
   - Select a number from the list
   - Enter display name: "Test Line"
   - Click "Purchase number"

3. **Verify it worked:**
   - Number appears in your numbers table ✅
   - Wallet balance decreased by $1.50 ✅
   - Check Twilio Console → Phone Numbers → Number is there ✅

---

## 🎯 What You Can Do Now

### Search Available Numbers
```javascript
POST /api/numbers/search
{
  "countryCode": "US",
  "numberType": "local",
  "areaCode": "212"  // Optional
}
```

### Purchase a Number
Wallet integration included! Automatically:
- Checks your balance
- Purchases from Twilio
- Deducts from wallet
- Configures webhooks

### Release a Number
Click the trash icon in the numbers table.
Number is released from both your database AND Twilio.

---

## 💰 Pricing

- **US Local:** $1.50/month
- **US Toll-Free:** $3.00/month
- **US Mobile:** $2.00/month

Prices include markup. Edit `lib/services/twilio/types.ts` to adjust.

---

## 🔧 For Production

1. **Set production webhook URL:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Add business address in Twilio** (for US compliance):
   - Twilio Console → Addresses
   - Add your business address

3. **Test webhooks work:**
   - Call one of your purchased numbers
   - Check `/api/voice-agent/handle-call` receives the webhook

---

## ✅ That's It!

You're now ready to provision phone numbers for your customers.

**Full documentation:** See `TWILIO_IMPLEMENTATION.md`
