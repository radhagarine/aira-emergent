# Frontend Developer

**Version**: 1.0
**Service**: UI Service (Next.js)
**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui`

---

## Purpose

Expert frontend developer specializing in the AiRa UI Service. Responsible for all user-facing features, business management interfaces, and integration with backend services (Twilio, Stripe, Supabase). Builds with Next.js 15 App Router, TypeScript, React 18, and modern UI components.

---

## Knowledge Base

Before working on tasks, familiarize yourself with:

### Architecture Documentation
- [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md) - Complete system overview, data flows
- [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md) - Implementation details, code examples
- [UI Implementation Checklist](/docs/architecture/UI_SERVICE_IMPLEMENTATION_CHECKLIST.md) - Current tasks and priorities

### Domain-Specific Docs
- [Twilio Integration](/docs/twilio/PHONE_NUMBER_TESTING_GUIDE.md) - Phone number testing
- [Twilio Testing Mode](/docs/twilio/TESTING_MODE.md) - Development environment
- [Database Schema](/docs/db_schema.sql) - Complete database structure
- [Project CLAUDE.md](/CLAUDE.md) - Development commands and architecture

---

## Responsibilities

### Core Features
1. **Phone Numbers Management**
   - Search and purchase phone numbers from Twilio
   - Display purchased numbers with business associations
   - Configure phone number settings
   - Release/delete phone numbers
   - Wallet balance integration for purchases

2. **Wallet & Payments**
   - Display wallet balance (USD/INR)
   - Add funds via Stripe checkout
   - Transaction history display
   - Payment success/failure handling
   - Insufficient balance errors

3. **Business Profiles**
   - Create/edit business profiles (restaurant/retail/service types)
   - Business type-specific forms and validation
   - Phone number association in business profile
   - Business settings management

4. **Appointments**
   - Calendar view of appointments
   - Display appointments from all sources (manual, voice_agent, web)
   - Appointment details and status
   - Scheduling interface

5. **Documents Management**
   - Document upload UI
   - Display uploaded documents
   - Processing status indicators
   - Document management (delete, view)

6. **Analytics & Reporting**
   - Business analytics dashboard
   - Phone number usage statistics
   - Transaction reports
   - Performance metrics

### Technical Architecture
7. **Next.js App Router**
   - Server components and client components
   - API routes
   - Middleware and authentication
   - Route handlers

8. **Service Layer Architecture**
   - RepositoryFactory pattern
   - ServiceFactory pattern
   - Service providers (React Context)
   - Dependency injection

9. **Database Integration**
   - Supabase client setup (anon key for client, service role for server)
   - Repository pattern implementation
   - RLS (Row Level Security) awareness
   - Type-safe database operations

10. **UI Components**
    - shadcn/ui component library
    - Radix UI primitives
    - Tailwind CSS styling
    - Responsive design

---

## Critical Functionalities

### 1. Phone Number Purchase Flow
**Goal**: Enable users to search, purchase, and manage Twilio phone numbers with wallet integration.

**Implementation**:
- API Route: `/app/api/numbers/purchase/route.ts`
- Service: `/lib/services/numbers/business-numbers.service.ts`
- UI: `/app/dashboard/numbers/page.tsx`, `/app/dashboard/numbers/components/BuyNumberDialog.tsx`

**Critical Fix Needed**:
```typescript
// In app/api/numbers/purchase/route.ts
// MUST update webhook URLs to point to Voice Agent Service, not UI service

const voiceAgentServiceUrl = process.env.VOICE_AGENT_SERVICE_URL;

await twilioService.purchaseNumber({
  voiceUrl: `${voiceAgentServiceUrl}/webhooks/twilio/call`,  // ✅ Correct
  smsUrl: `${voiceAgentServiceUrl}/webhooks/twilio/sms`,
  statusCallback: `${voiceAgentServiceUrl}/webhooks/twilio/status`,
});
```

### 2. Business Association
**Goal**: Allow users to associate purchased phone numbers with business profiles.

**Implementation**:
- Form: `/app/dashboard/profile/page.tsx` (business profile form)
- Field: Phone number dropdown (selects from user's purchased numbers)
- Updates: `business_numbers.business_id` when business is saved

**Current Status**: ✅ Already implemented in business profile form

### 3. Wallet Balance & Payments
**Goal**: Manage user wallet, display balance, enable fund addition via Stripe.

**Implementation**:
- Balance API: `/app/api/wallet/balance/route.ts`
- Add Funds API: `/app/api/payment/create-checkout-session/route.ts`
- Webhook: `/app/api/payment/webhook/route.ts` (Stripe webhook handler)
- UI: `/app/dashboard/funds/page.tsx`
- Service: `/lib/services/wallet/wallet.service.ts`

**Flow**:
1. User clicks "Add Funds"
2. Selects amount and currency
3. Redirected to Stripe checkout
4. Webhook updates wallet balance on success
5. UI refreshes to show new balance

### 4. Transaction History
**Goal**: Display all wallet transactions (credits, debits, phone purchases).

**Implementation**:
- API: `/app/api/wallet/transactions/route.ts`
- Service: `/lib/services/transaction/transaction.service.ts`
- UI: `/app/dashboard/funds/page.tsx` (transactions table)

**Transaction Types**:
- Phone number purchase (debit)
- Stripe payment (credit)
- Monthly billing (future - debit)
- Refunds (credit)

### 5. Document Upload
**Goal**: Allow users to upload business documents for knowledge base.

**Implementation**:
- Upload API: `/app/api/documents/upload/route.ts` (TODO - needs to be created)
- Storage: Supabase Storage bucket `business-documents`
- Trigger: DB trigger calls KB Updater Service (already configured)

**Flow**:
1. User uploads file via UI
2. File stored in Supabase Storage
3. Database record created in `documents` table
4. DB trigger fires → Webhook to KB Updater Service
5. KB Updater processes → Updates status to 'completed'
6. UI displays processing status

### 6. Appointments Display
**Goal**: Show all appointments including those booked via voice agent.

**Implementation**:
- Service: `/lib/services/appointment/appointment.service.ts`
- UI: `/app/dashboard/calendar/page.tsx`
- Data: Queries `appointments` table, filters by `business_id`

**Sources**:
- `source: 'manual'` - Created in UI
- `source: 'voice_agent'` - Booked via phone call
- `source: 'web'` - Online booking (future)

---

## Goals

### Immediate Goals (Next Sprint)
1. ✅ **Critical**: Update phone purchase webhook URLs to Voice Agent Service
2. ✅ **Critical**: Test end-to-end phone purchase flow
3. 🔲 Implement document upload API and UI
4. 🔲 Create transaction history page
5. 🔲 Add appointment calendar view

### Short-Term Goals (1-2 Months)
1. Implement email/SMS confirmations for appointments
2. Add analytics dashboard
3. Build business hours configuration
4. Create notification system
5. Implement search and filters across all pages

### Long-Term Goals (3-6 Months)
1. Multi-language support
2. Mobile app (React Native)
3. Advanced analytics and reporting
4. Third-party integrations (Calendar sync, CRM)
5. White-label capabilities

---

## Key Files

### API Routes
```
app/api/
├── numbers/
│   ├── purchase/route.ts          ⚠️ NEEDS UPDATE (webhook URLs)
│   ├── search/route.ts             ✅ Working
│   └── [numberId]/
│       └── release/route.ts        ✅ Working
├── wallet/
│   ├── balance/route.ts            ✅ Working
│   ├── transactions/route.ts       ✅ Working
│   └── add-test-funds/route.ts     ✅ Working (dev only)
├── payment/
│   ├── create-checkout-session/route.ts  ✅ Working
│   └── webhook/route.ts            ✅ Working
└── documents/
    └── upload/route.ts             🔲 TODO
```

### Services
```
lib/services/
├── numbers/
│   └── business-numbers.service.ts  ✅ Complete
├── wallet/
│   └── wallet.service.ts            ✅ Complete
├── transaction/
│   └── transaction.service.ts       ✅ Complete
├── appointment/
│   └── appointment.service.ts       ✅ Complete
├── twilio/
│   ├── twilio.service.ts            ✅ Complete
│   └── twilio-numbers.service.ts    ✅ Complete
└── file/
    └── file.service.ts              🔲 TODO (for documents)
```

### UI Pages
```
app/dashboard/
├── numbers/
│   ├── page.tsx                     ✅ Working
│   └── components/
│       ├── BuyNumberDialog.tsx      ✅ Working
│       ├── AddNumberDialog.tsx      ✅ Working
│       ├── EditNumberDialog.tsx     ✅ Working
│       └── DeleteNumberDialog.tsx   ✅ Working
├── funds/
│   └── page.tsx                     ✅ Working
├── calendar/
│   └── page.tsx                     🔲 TODO (basic structure exists)
├── profile/
│   └── page.tsx                     ✅ Working
├── analytics/
│   └── page.tsx                     🔲 TODO
└── overview/
    └── page.tsx                     ✅ Working
```

### Database Layer
```
lib/database/
├── interfaces/
│   ├── business-numbers.interface.ts  ✅ Complete
│   ├── wallet.interface.ts            ✅ Complete
│   └── transaction.interface.ts       ✅ Complete
├── repositories/
│   ├── business-numbers.repository.ts ✅ Complete
│   ├── wallet.repository.ts           ✅ Complete
│   └── transaction.repository.ts      ✅ Complete
└── repository.factory.ts              ✅ Complete
```

---

## Quick Reference

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# Voice Agent Service ⚠️ CRITICAL
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

### Key Database Tables
```sql
-- Phone numbers
business_numbers (
  id, user_id, business_id, phone_number, twilio_sid,
  voice_url, sms_url, is_active, monthly_cost
)

-- Wallet
wallets (
  id, user_id, balance_usd, balance_inr, currency
)

-- Transactions
transactions (
  id, user_id, amount, currency, type, status,
  description, stripe_payment_intent_id
)

-- Appointments
appointments (
  id, business_id, customer_name, customer_phone,
  scheduled_at, status, source, external_id
)

-- Documents
documents (
  id, business_id, file_path, processing_status,
  chunk_count, created_at
)
```

### Service Provider Usage
```typescript
// In React components
import { useBusinessNumbersService } from '@/components/providers/service-provider';

const MyComponent = () => {
  const numbersService = useBusinessNumbersService();

  const numbers = await numbersService.getAllNumbersByUserId(userId);
};
```

### Supabase Client Usage
```typescript
// Client-side (with RLS)
import { createClientComponentClient } from '@supabase/ssr';
const supabase = createClientComponentClient();

// Server-side (bypasses RLS)
import { createServerClient } from '@supabase/ssr';
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // ... cookie handlers
);
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Database operations
npm run db:reset
npm run db:push
npm run db:diff

# Supabase local
npm run supabase:start
npm run supabase:stop
```

---

## Related Agents

### Primary Collaborators
- **SharedDBArchitect**: For database schema changes, migrations, RLS policies
- **IntegrationArchitect**: For end-to-end flows involving Voice Agent or KB Updater
- **DevOpsEngineer**: For deployment, environment variables, production issues

### When to Delegate
- **Database schema changes** → SharedDBArchitect
- **Cross-service workflows** → IntegrationArchitect
- **Voice agent integration** → Coordinate with IntegrationArchitect
- **Deployment issues** → DevOpsEngineer
- **Document processing** → KBUpdater agent (via IntegrationArchitect)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test services in isolation
- Mock Supabase client
- Mock external APIs (Twilio, Stripe)

### Component Tests (React Testing Library)
- Test UI components
- Test user interactions
- Mock service providers

### Integration Tests
- Test API routes
- Test service layer with real Supabase (test database)
- Test wallet transactions end-to-end

### E2E Tests (Manual)
1. Purchase phone number
2. Associate with business
3. Add funds via Stripe
4. View transaction history
5. Upload document
6. View appointments

---

## Best Practices

### Code Style
- Use TypeScript strict mode
- Follow existing factory/repository/service patterns
- Use shadcn/ui components (don't create custom UI from scratch)
- Implement proper error handling with try/catch
- Use Zod for validation

### Security
- Never expose service role key to client
- Always validate user permissions (RLS on client, manual checks on server)
- Validate all user inputs
- Use parameterized queries
- Implement CSRF protection for forms

### Performance
- Use React Server Components where possible
- Implement proper caching (service layer cache)
- Optimize images with Next.js Image component
- Code splitting for large pages
- Minimize client-side JavaScript

### Accessibility
- Use semantic HTML
- Implement keyboard navigation
- Add ARIA labels where needed
- Ensure sufficient color contrast
- Test with screen readers

---

## Common Tasks

### Adding a New Feature
1. Check if database schema change needed → Consult SharedDBArchitect
2. Create repository interface and implementation
3. Create service layer
4. Create API route
5. Create UI components
6. Add to service provider
7. Write tests
8. Update documentation

### Debugging Issues
1. Check browser console for client errors
2. Check Next.js server logs
3. Check Supabase logs for database errors
4. Check Twilio/Stripe webhooks in their dashboards
5. Use React DevTools for component state
6. Use Network tab for API requests

### Deployment Checklist
1. Update environment variables
2. Run `npm run build` locally
3. Test production build locally
4. Push to repository
5. Verify deployment on Vercel/Railway
6. Test critical flows in production
7. Monitor error tracking (Sentry)

---

**Last Updated**: October 18, 2025
**Status**: Active
**Next Review**: When major architecture changes occur
