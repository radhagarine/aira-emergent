# Backend Porting Plan: Aira_OAuth → aira-ui

## Overview
Port all backend functionality from `aira-platformRearch` (Aira_OAuth repo) to `aira-ui` repo

---

## ✅ Already Exists in aira-ui (No Port Needed)

### Services
- ✅ `lib/services/analytics/`
- ✅ `lib/services/appointment/`
- ✅ `lib/services/business/`
- ✅ `lib/services/common/`
- ✅ `lib/services/file/`
- ✅ `lib/services/numbers/` (needs verification)
- ✅ `lib/services/performance/`
- ✅ `lib/services/settings/`
- ✅ `lib/services/service.factory.ts`

### UI Pages
- ✅ `app/dashboard/funds/page.tsx` (exists)
- ✅ `app/dashboard/numbers/page.tsx` (exists)

---

## 🔄 Need to Port from Aira_OAuth

### 1. NEW Services (Missing in aira-ui)

#### Wallet Service
```
lib/services/wallet/
├── wallet.service.ts
├── types.ts
└── index.ts
```

#### Payment/Stripe Service
```
lib/services/payment/
├── stripe.service.ts
├── types.ts
└── index.ts
```

#### Twilio Service
```
lib/services/twilio/
├── twilio.service.ts
├── phone-numbers.service.ts
├── voice.service.ts
├── types.ts
└── index.ts
```

#### Transaction Service
```
lib/services/transaction/
├── transaction.service.ts
├── types.ts
└── index.ts
```

#### Chatbot Service
```
lib/services/chatbot/
├── chatbot.service.ts
└── index.ts
```

---

### 2. API Routes (All Missing in aira-ui)

aira-ui has **NO app/api/** directory at all!

Need to create and port:

```
app/api/
├── wallet/
│   ├── balance/route.ts
│   └── transactions/route.ts
├── payment/
│   ├── create-checkout-session/route.ts
│   └── webhook/route.ts
├── numbers/
│   ├── search/route.ts
│   ├── purchase/route.ts
│   └── [numberId]/
│       └── release/route.ts
├── voice-agent/
│   ├── handle-call/route.ts
│   ├── handle-sms/route.ts
│   └── status/route.ts
└── chatbot/
    └── route.ts
```

---

### 3. Database Layer

#### New Repositories
```
lib/database/repositories/
├── wallet.repository.ts
├── transaction.repository.ts
└── business-numbers.repository.ts (verify if exists)
```

#### Repository Interfaces
```
lib/database/interfaces/
├── wallet.repository.interface.ts
├── transaction.repository.interface.ts
└── business-numbers.repository.interface.ts
```

#### Update Repository Factory
- Add wallet repository
- Add transaction repository
- Update `lib/database/repository.factory.ts`

---

### 4. Type Definitions

```
lib/types/database/
├── wallet.types.ts
├── transaction.types.ts
└── numbers.types.ts (verify)
```

---

### 5. Database Migrations

```
supabase/migrations/
├── 20251002000001_create_business_numbers.sql
├── 20251006000001_add_twilio_fields_to_business_numbers.sql
├── [wallet tables migration]
└── [transactions table migration]
```

---

### 6. UI Components to Update

#### Funds Page
- Check if implementation matches OAuth version
- File: `app/dashboard/funds/page.tsx`

#### Numbers Page Components
```
app/dashboard/numbers/components/
├── AddNumberDialog.tsx
├── EditNumberDialog.tsx
└── DeleteNumberDialog.tsx
```

---

### 7. Environment Variables

Update `.env.example` with:
```bash
# Existing (verify)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=

# NEW - Need to add
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

### 8. Service Factory Updates

Update `lib/services/service.factory.ts` to include:
- `getWalletService()`
- `getStripeService()`
- `getTwilioService()`
- `getTransactionService()`

---

### 9. Documentation Files

```
WALLET_DATABASE_INFO.md
TWILIO_IMPLEMENTATION.md
QUICK_START_TWILIO.md
```

---

## 📋 Porting Order (Priority)

### Phase 1: Core Backend (Priority 1)
1. Database repositories (wallet, transaction, business_numbers)
2. Type definitions
3. Database migrations
4. Wallet service
5. Transaction service
6. Payment/Stripe service

### Phase 2: API Routes (Priority 2)
7. Create `app/api/` directory structure
8. Wallet API routes
9. Payment API routes
10. Update service factory

### Phase 3: Twilio Integration (Priority 3)
11. Twilio service
12. Numbers API routes
13. Voice agent API routes

### Phase 4: UI & Testing (Priority 4)
14. Update funds page if needed
15. Update numbers page components
16. Update .env.example
17. Add documentation

### Phase 5: Verification (Priority 5)
18. Test wallet funding flow
19. Test phone number purchase
20. Create PR

---

## 🚨 Critical Dependencies

**Must port in this order:**
1. Types → Repositories → Services → API Routes
2. Database migrations before repositories
3. Service factory updates after each service
4. Test each phase before moving to next

---

## 📝 Notes

- aira-ui already has dashboard UI structure
- Focus on backend (services, API routes, database)
- The UI might just need minor updates
- All API routes need to be created from scratch
