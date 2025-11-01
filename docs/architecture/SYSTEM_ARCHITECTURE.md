# AiRa System Architecture

**Version**: 1.0
**Last Updated**: October 18, 2025
**Status**: Current Implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Architecture](#service-architecture)
3. [Current Implementation](#current-implementation)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Database Schema](#database-schema)
6. [Service Communication](#service-communication)
7. [Environment Configuration](#environment-configuration)
8. [Deployment Architecture](#deployment-architecture)
9. [Future Roadmap](#future-roadmap)
10. [Decision Log](#decision-log)

---

## System Overview

AiRa is a **microservices-based business management platform** that enables businesses to:
- Purchase and manage phone numbers
- Upload business documents for AI knowledge base
- Handle customer calls via AI voice agents
- Manage appointments, bookings, and customer interactions

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AiRa Platform                            │
├──────────────────┬──────────────────┬───────────────────────┤
│   UI Service     │  KB Updater      │  Voice Agent Service  │
│   (Next.js)      │  Service         │  (Node.js/Express)    │
│                  │                  │                       │
│ - User interface │ - Doc processing │ - Handle calls        │
│ - Phone purchase │ - Vector DB      │ - Query knowledge     │
│ - Doc upload     │ - Embeddings     │ - Book appointments   │
│ - Business mgmt  │                  │                       │
└────────┬─────────┴────────┬─────────┴───────┬───────────────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   Supabase DB    │
                   │  (Shared Data)   │
                   └──────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
         ┌────▼────┐   ┌───▼────┐   ┌────▼─────┐
         │ Vector  │   │Storage │   │  Redis   │
         │   DB    │   │ (S3)   │   │  Cache   │
         └─────────┘   └────────┘   └──────────┘
```

---

## Service Architecture

### 1. UI Service (This Repository)

**Technology**: Next.js 13+ (App Router), TypeScript, React 18

**Responsibilities**:
- ✅ User authentication and authorization
- ✅ Business profile management
- ✅ Phone number purchase from Twilio
- ✅ Document upload to storage
- ✅ Display appointments, analytics, and reports
- ✅ Wallet management and payments (Stripe)
- ✅ Configure Twilio webhook URLs (pointing to Voice Agent Service)

**Key Features**:
- Dashboard for business owners
- Phone number marketplace (search, purchase, manage)
- Document management UI
- Appointment calendar
- Analytics and reporting

**Does NOT Handle**:
- ❌ Twilio call webhooks (handled by Voice Agent Service)
- ❌ Document processing (handled by KB Updater Service)
- ❌ Voice AI integration (handled by Voice Agent Service)

**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui`

---

### 2. Knowledge Base Updater Service

**Technology**: Node.js/Python (TBD)

**Responsibilities**:
- ✅ Listen for document upload events (DB triggers)
- ✅ Download documents from storage
- ✅ Parse and chunk documents (PDF, DOCX, TXT, etc.)
- ✅ Generate embeddings using OpenAI/Cohere
- ✅ Store vectors in vector database (Pinecone, Weaviate, or pgvector)
- ✅ Associate knowledge with `business_id`

**Trigger Mechanism**:
- **Database trigger** on `documents` table
- Calls webhook: `POST {KB_UPDATER_URL}/process-document`

**Data Flow**:
```
User uploads doc → Stored in Supabase Storage → DB record created
   ↓
DB trigger fires → Webhook to KB Updater
   ↓
KB Updater downloads → Processes → Creates embeddings → Stores in vector DB
   ↓
Updates document status: pending → processing → completed
```

**Repository**: (Separate service - not in this repo)

---

### 3. Voice Agent Service

**Technology**: Node.js/Express, TypeScript

**Responsibilities**:
- ✅ Receive Twilio webhooks for incoming calls
- ✅ Look up business by phone number (direct DB query)
- ✅ Query vector database for business knowledge
- ✅ Integrate with voice AI provider (Vapi, Retell, etc.)
- ✅ Handle call flow (answer queries, book appointments)
- ✅ Create appointments (direct DB insert)
- ✅ Send SMS confirmations

**Key Endpoints**:
- `POST /webhooks/twilio/call` - Incoming call handler
- `POST /webhooks/twilio/sms` - Incoming SMS handler
- `POST /webhooks/twilio/status` - Call status updates
- `POST /webhooks/vapi/function-call` - Handle Vapi function calls (appointment booking)

**Repository**: `https://github.com/radhagarine/airavoiceagent`

---

## Current Implementation

### Architecture Pattern: **Shared Database**

**Decision**: All three services access the same Supabase database directly.

**Rationale**:
- ✅ **Simplicity**: No API layer needed for service-to-service communication
- ✅ **Performance**: No HTTP overhead, direct SQL queries
- ✅ **Speed to market**: Faster implementation, ship product sooner
- ✅ **Consistency**: No data synchronization issues
- ✅ **Transactional**: ACID guarantees for cross-service operations

**Trade-offs**:
- ⚠️ **Tight coupling**: Schema changes affect multiple services
- ⚠️ **Shared credentials**: All services need DB access
- ⚠️ **Deployment dependency**: Services must stay compatible with schema

---

## Data Flow Diagrams

### 1. Phone Number Purchase Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Clicks "Buy Number"
     ▼
┌─────────────────┐
│  UI Service     │
│  /api/numbers/  │
│   purchase      │
└────┬────────────┘
     │ 2. Check wallet balance
     │ 3. Purchase from Twilio
     │    ⚠️ Set webhook URLs to Voice Agent Service
     │    voiceUrl: https://voice-agent.domain.com/webhooks/twilio/call
     │ 4. Save to business_numbers table
     │    - user_id: <user>
     │    - business_id: NULL (not yet associated)
     │    - twilio_sid
     │    - webhook URLs
     ▼
┌─────────────────┐
│  Supabase DB    │
│ business_numbers│
└─────────────────┘
```

---

### 2. Business Association Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Creates/edits business profile
     │ 2. Selects phone number from dropdown
     ▼
┌─────────────────┐
│  UI Service     │
│  Business Form  │
└────┬────────────┘
     │ 3. Update business_v2 table
     │    - phone_number: +1234567890
     │
     │ 4. Update business_numbers table
     │    - business_id: <business_id>
     ▼
┌─────────────────┐
│  Supabase DB    │
│ business_numbers│
│    ├─ user_id   │
│    └─ business_id (NOW SET)
└─────────────────┘
```

**Note**: Association happens in the business profile form, not via separate API.

---

### 3. Document Upload & Knowledge Base Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Uploads document
     ▼
┌─────────────────┐
│  UI Service     │
│  /api/documents/│
│   upload        │
└────┬────────────┘
     │ 2. Upload to Supabase Storage
     │ 3. Create DB record
     ▼
┌─────────────────┐
│  Supabase DB    │
│   documents     │
│  ├─ business_id │
│  ├─ file_path   │
│  └─ status: pending
└────┬────────────┘
     │ 4. DB Trigger fires
     │    ⚠️ Already configured
     ▼
┌─────────────────────┐
│ KB Updater Service  │
│  Webhook Handler    │
└────┬────────────────┘
     │ 5. Download file from storage
     │ 6. Parse & chunk document
     │ 7. Generate embeddings
     │ 8. Store in vector DB
     │ 9. Update status: completed
     ▼
┌─────────────────┐
│   Vector DB     │
│  (Pinecone/     │
│   pgvector)     │
│  ├─ business_id │
│  ├─ chunks      │
│  └─ embeddings  │
└─────────────────┘
```

**Already Implemented**: ✅ DB trigger → KB Updater webhook

---

### 4. Incoming Call Flow

```
┌──────────────┐
│  Customer    │
│  Calls number│
└──────┬───────┘
       │ 1. Dials +1234567890
       ▼
┌──────────────┐
│   Twilio     │
│   (Cloud)    │
└──────┬───────┘
       │ 2. POST webhook to configured URL
       │    https://voice-agent.domain.com/webhooks/twilio/call
       │    Body: { From, To, CallSid }
       ▼
┌────────────────────┐
│ Voice Agent Service│
│  /webhooks/twilio/ │
│     call           │
└────┬───────────────┘
     │ 3. Query DB: SELECT * FROM business_numbers WHERE phone_number = To
     ▼
┌─────────────────┐
│  Supabase DB    │
│ business_numbers│
│    JOIN         │
│ business_v2     │
└────┬────────────┘
     │ 4. Returns business details
     │    { business_id, name, type, description }
     ▼
┌────────────────────┐
│ Voice Agent Service│
└────┬───────────────┘
     │ 5. Query vector DB for business knowledge
     ▼
┌─────────────────┐
│   Vector DB     │
│  WHERE business_│
│   id = ?        │
└────┬────────────┘
     │ 6. Returns relevant context
     │    { FAQ, products, hours, etc. }
     ▼
┌────────────────────┐
│ Voice Agent Service│
└────┬───────────────┘
     │ 7. Create call with Vapi/Retell
     │    - Business context
     │    - Greeting message
     │    - Capabilities (book appointments, answer questions)
     │
     │ 8. Return TwiML to Twilio
     │    <Response>
     │      <Connect>
     │        <Stream url="wss://api.vapi.ai/..." />
     │      </Connect>
     │    </Response>
     ▼
┌──────────────┐
│   Twilio     │
│  Connects to │
│   Vapi       │
└──────┬───────┘
       │ 9. Customer talks to AI agent
       ▼
┌──────────────┐
│  Vapi/Retell │
│  AI Agent    │
│  - Answers   │
│  - Books appt│
└──────────────┘
```

---

### 5. Appointment Booking Flow (via Voice Agent)

```
┌──────────────┐
│   Customer   │
│  "Book appt" │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Vapi Agent  │
│  Extracts:   │
│  - Date      │
│  - Time      │
│  - Name      │
│  - Phone     │
└──────┬───────┘
       │ Function call: bookAppointment
       │ POST /webhooks/vapi/function-call
       ▼
┌────────────────────┐
│ Voice Agent Service│
│  Function Handler  │
└────┬───────────────┘
     │ Validation:
     │ - Check business hours (DB function)
     │ - Check conflicts (DB function)
     │
     │ If valid:
     │ ▼
┌─────────────────┐
│  Supabase DB    │
│  appointments   │
│  INSERT INTO    │
│    ├─ business_id
│    ├─ customer_name
│    ├─ customer_phone
│    ├─ scheduled_at
│    ├─ source: 'voice_agent'
│    └─ status: 'confirmed'
└────┬────────────┘
     │
     │ DB triggers:
     │ - Send confirmation email (TODO)
     │ - Send confirmation SMS (TODO)
     │
     ▼
┌──────────────┐
│  Customer    │
│  Receives    │
│  confirmation│
└──────────────┘
```

**Validation**: Currently handled by **database functions** (as per user's implementation)

---

## Database Schema

### Key Tables

#### 1. `business_numbers`

```sql
CREATE TABLE business_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),           -- Owner of the number
    business_id UUID REFERENCES business_v2(id),      -- Associated business (nullable)

    -- Phone number details
    phone_number TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    number_type business_number_type NOT NULL,

    -- Twilio fields
    twilio_sid TEXT UNIQUE,
    twilio_account_sid TEXT,
    voice_url TEXT,                                   -- Points to Voice Agent Service
    sms_url TEXT,                                     -- Points to Voice Agent Service
    status_callback_url TEXT,                         -- Points to Voice Agent Service
    capabilities JSONB,

    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    provider TEXT DEFAULT 'twilio',

    -- Metadata
    purchase_date TIMESTAMP WITH TIME ZONE,
    monthly_cost DECIMAL(10, 2),
    features JSONB DEFAULT '[]'::jsonb,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Points**:
- `user_id`: User who purchased the number
- `business_id`: Business the number is associated with (set via business profile form)
- `voice_url`: Points to Voice Agent Service (e.g., `https://voice-agent.domain.com/webhooks/twilio/call`)

---

#### 2. `documents`

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_v2(id),

    -- File details
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,

    -- Processing status
    processing_status TEXT DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,

    -- Vector DB reference
    vector_db_id TEXT,  -- ID in Pinecone/pgvector
    chunk_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to notify KB Updater Service
CREATE TRIGGER notify_kb_updater_on_upload
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_kb_updater_webhook();
```

**Already Implemented**: ✅ DB trigger calls KB Updater webhook

---

#### 3. `appointments`

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_v2(id),

    -- Customer details
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,

    -- Appointment details
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 60,  -- minutes
    status TEXT DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),

    -- Source tracking
    source TEXT DEFAULT 'manual'
        CHECK (source IN ('manual', 'voice_agent', 'web', 'sms')),
    external_id TEXT,  -- Twilio CallSid or other reference

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation function (check business hours, conflicts)
CREATE FUNCTION validate_appointment_time(
    p_business_id UUID,
    p_scheduled_at TIMESTAMP WITH TIME ZONE,
    p_duration INTEGER
) RETURNS BOOLEAN AS $$
    -- Implementation: Check business hours, existing appointments, etc.
$$ LANGUAGE plpgsql;
```

**Validation**: Currently handled by **database functions** ✅

---

## Service Communication

### Current Implementation: **Direct Database Access**

All services share the same Supabase database and query it directly.

#### Connection Configuration

**UI Service** (`lib/database/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role for backend
);
```

**Voice Agent Service**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Business lookup
async function getBusinessByPhone(phoneNumber: string) {
  const { data, error } = await supabase
    .from('business_numbers')
    .select(`
      *,
      business_v2 (
        id,
        name,
        business_type,
        description,
        email,
        address
      )
    `)
    .eq('phone_number', phoneNumber)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
}
```

**KB Updater Service**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update document status
async function updateDocumentStatus(documentId: string, status: string) {
  await supabase
    .from('documents')
    .update({
      processing_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId);
}
```

---

### Security Considerations

**Row Level Security (RLS)**:
- User-facing requests: Use user's session token (RLS enforced)
- Service-to-service: Use service role key (bypasses RLS)

**Best Practices**:
- ✅ Service role key stored in environment variables (never committed)
- ✅ Service role key only used on backend, never exposed to frontend
- ✅ Each service has its own environment configuration
- ✅ Connection pooling enabled for performance

---

## Environment Configuration

### UI Service (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# Voice Agent Service URL (for webhook configuration)
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Storage
SUPABASE_STORAGE_BUCKET=business-documents

# App URL
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

---

### Voice Agent Service (`.env`)

```bash
# Supabase (same database as UI Service)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Twilio (for webhook validation)
TWILIO_AUTH_TOKEN=xxxx

# Voice AI Provider
VAPI_API_KEY=vapi_xxx
# OR
RETELL_API_KEY=retell_xxx

# Vector Database
PINECONE_API_KEY=xxxx
PINECONE_INDEX_NAME=aira-business-knowledge
# OR
PGVECTOR_CONNECTION_STRING=postgres://...

# Server
PORT=3001
NODE_ENV=production
```

---

### Knowledge Base Updater Service (`.env`)

```bash
# Supabase (same database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-xxx

# Vector Database
PINECONE_API_KEY=xxxx
PINECONE_INDEX_NAME=aira-business-knowledge

# Webhook server
PORT=3002
NODE_ENV=production
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  UI Service     │     │ KB Updater      │     │ Voice Agent     │
│  localhost:3000 │     │ localhost:3002  │     │ localhost:3001  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Supabase Cloud   │
                        │ (Development)    │
                        └──────────────────┘
```

**Twilio Webhook Testing**: Use ngrok to expose Voice Agent Service
```bash
ngrok http 3001
# Update Twilio webhook URL to: https://xxxxx.ngrok.io/webhooks/twilio/call
```

---

### Production Environment

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  UI Service     │     │ KB Updater      │     │ Voice Agent     │
│  Vercel/Railway │     │ Railway/Cloud   │     │ Railway/Cloud   │
│  app.domain.com │     │ kb.domain.com   │     │ voice.domain.com│
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Supabase Cloud   │
                        │ (Production)     │
                        └──────┬───────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────▼───┐ ┌───▼────┐ ┌───▼────┐
              │Pinecone │ │Storage │ │ Redis  │
              │Vector DB│ │  (S3)  │ │ Cache  │
              └─────────┘ └────────┘ └────────┘
```

**Deployment Platforms**:
- **UI Service**: Vercel (recommended) or Railway
- **Voice Agent**: Railway, Render, or AWS ECS
- **KB Updater**: Railway, Google Cloud Run, or AWS Lambda

---

## Future Roadmap

### Phase 1: Current Implementation (✅ In Progress)
- Direct database access for all services
- Database triggers for KB Updater
- Simple, fast to market

### Phase 2: Enhanced Features (Next 3-6 months)
- ✅ Email/SMS confirmations on appointment booking
- ✅ Advanced scheduling conflict detection
- ✅ Multiple voice AI provider support (Vapi, Retell, Bland)
- ✅ Call analytics and reporting
- ✅ Custom voice agent prompts per business

### Phase 3: Service API Separation (6-12 months)

**When to migrate**: When experiencing:
- Schema coupling issues
- Need for independent scaling
- Different deployment requirements
- Multi-region expansion

**Migration Plan**:

**Step 1: Add Internal APIs** (Non-breaking)
```typescript
// UI Service exposes APIs
GET  /api/internal/business-lookup?phoneNumber=+1234
POST /api/internal/appointments

// Voice Agent Service uses APIs (optional, falls back to DB)
const business = await fetchFromAPI() || await queryDB();
```

**Step 2: Gradual Migration**
- Add API endpoints while keeping DB access
- Measure performance impact
- Migrate one operation at a time

**Step 3: Remove Direct DB Access**
- Voice Agent only uses APIs
- Remove database credentials from Voice Agent
- Complete separation

**Benefits of Future API Approach**:
- ✅ Independent deployment
- ✅ Better security boundaries
- ✅ Easier to add caching layers
- ✅ Service can be in different cloud providers

**Estimated Effort**: 2-4 weeks
**Priority**: Low (only when scaling requires it)

---

## Decision Log

### Decision 1: Shared Database vs Microservices with APIs

**Date**: October 18, 2025
**Decision**: Use shared database with direct access
**Status**: ✅ Current Implementation

**Context**:
- Need to ship product quickly
- All services in same infrastructure
- Performance critical for voice webhooks
- Team size: Small (need simplicity)

**Options Considered**:
1. ✅ **Shared Database** (chosen)
   - Pros: Simple, fast, consistent
   - Cons: Tight coupling

2. ❌ Service APIs
   - Pros: Loose coupling, scalable
   - Cons: More complex, slower, more code

3. ❌ Event-Driven (message queue)
   - Pros: Async, decoupled
   - Cons: Too complex for v1

**Decision**: Start with shared database, migrate to APIs later if needed

**Revisit**: When experiencing scaling issues or schema coupling problems

---

### Decision 2: Business Association via Form vs API

**Date**: October 18, 2025
**Decision**: Use existing business profile form
**Status**: ✅ Current Implementation

**Context**:
- Business profile form already has phone number field
- Users naturally select number when creating business
- No need for separate "Configure Number" step

**Alternative**: Separate API endpoint for number association
**Rejected because**: Adds unnecessary complexity, form already handles it

---

### Decision 3: Document Upload Trigger Mechanism

**Date**: Prior to October 18, 2025
**Decision**: Database trigger → Webhook
**Status**: ✅ Already Implemented

**Implementation**:
```sql
CREATE TRIGGER notify_kb_updater_on_upload
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_kb_updater_webhook();
```

**Why**: Automatic, reliable, no application code needed

---

### Decision 4: Appointment Validation Strategy

**Date**: October 18, 2025
**Decision**: Database functions for validation
**Status**: ✅ Current Implementation

**Context**:
- Need to validate business hours
- Check scheduling conflicts
- Maintain data integrity

**Implementation**: PostgreSQL functions (as per user's repo)
```sql
CREATE FUNCTION validate_appointment_time(...) RETURNS BOOLEAN;
```

**Benefits**:
- ✅ Works from any service (UI or Voice Agent)
- ✅ Single source of truth
- ✅ Database enforces rules

---

### Decision 5: Voice Agent Provider

**Date**: TBD
**Decision**: To be determined (Vapi vs Retell vs Custom)
**Status**: ⏳ Pending

**Options**:
1. **Vapi.ai**
   - Best for ease of use
   - Built-in Twilio integration
   - $0.05/min

2. **Retell AI**
   - Lower latency
   - Custom voice support
   - More control

3. **Custom (OpenAI Realtime API)**
   - Maximum flexibility
   - Most complex
   - Lower cost at scale

**Next Step**: Prototype with Vapi for MVP, evaluate others later

---

## Monitoring and Observability

### Key Metrics to Track

**UI Service**:
- Phone number purchase success rate
- Document upload failures
- Page load times
- API response times

**Voice Agent Service**:
- Webhook response time (< 5 seconds critical)
- Call success rate
- Appointment booking conversion rate
- Vector DB query latency

**KB Updater Service**:
- Document processing time
- Embedding generation success rate
- Vector DB insertion failures

### Recommended Tools

- **Application Monitoring**: Sentry, LogRocket
- **Infrastructure**: Railway metrics, Vercel Analytics
- **Database**: Supabase Dashboard, pg_stat_statements
- **Logs**: CloudWatch, Papertrail, or Railway logs
- **Alerts**: PagerDuty, Slack webhooks

---

## Security Considerations

### 1. Twilio Webhook Validation

**Voice Agent Service must validate** that requests come from Twilio:

```typescript
import twilio from 'twilio';

function validateTwilioRequest(req: Request): boolean {
  const signature = req.headers['x-twilio-signature'];
  const url = `https://voice-agent.domain.com${req.url}`;
  const params = req.body;

  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  );
}
```

**Critical**: Always validate webhooks to prevent spoofing

---

### 2. Service Role Key Protection

**Never**:
- ❌ Commit service role keys to git
- ❌ Expose in client-side code
- ❌ Log in application logs
- ❌ Share between environments (dev/prod)

**Always**:
- ✅ Store in environment variables
- ✅ Rotate periodically
- ✅ Use separate keys per environment
- ✅ Audit access logs

---

### 3. Database Access Patterns

**From Client (UI Service frontend)**:
- Use anon key with RLS enabled
- User can only access their own data

**From Server (API routes, Voice Agent, KB Updater)**:
- Use service role key (bypasses RLS)
- Validate user permissions in application code

---

## Troubleshooting Guide

### Issue: Incoming calls not reaching Voice Agent

**Check**:
1. Twilio webhook URL configured correctly?
   ```sql
   SELECT voice_url FROM business_numbers WHERE phone_number = '+1234567890';
   ```
   Should be: `https://voice-agent.domain.com/webhooks/twilio/call`

2. Voice Agent Service running and accessible?
   ```bash
   curl https://voice-agent.domain.com/health
   ```

3. Check Twilio debugger for webhook errors
   - Go to Twilio Console → Monitor → Logs → Errors

---

### Issue: Documents stuck in "pending" status

**Check**:
1. KB Updater Service running?
2. Database trigger configured?
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'notify_kb_updater_on_upload';
   ```
3. Check KB Updater logs for processing errors

---

### Issue: Appointments not being created from voice calls

**Check**:
1. Voice Agent can write to database?
   ```typescript
   // Test query
   const { data, error } = await supabase.from('appointments').select('*').limit(1);
   console.log(error);  // Should be null
   ```
2. Database function validation passing?
   ```sql
   SELECT validate_appointment_time(
     '<business_id>'::uuid,
     '2025-10-20 14:00:00'::timestamptz,
     60
   );
   ```

---

## Appendix

### A. Useful SQL Queries

**Find numbers without business association**:
```sql
SELECT * FROM business_numbers
WHERE business_id IS NULL
ORDER BY created_at DESC;
```

**Check webhook configuration**:
```sql
SELECT
  phone_number,
  display_name,
  voice_url,
  sms_url,
  is_active
FROM business_numbers
WHERE is_active = true;
```

**Recent appointments from voice agent**:
```sql
SELECT
  a.*,
  b.name as business_name
FROM appointments a
JOIN business_v2 b ON a.business_id = b.id
WHERE a.source = 'voice_agent'
ORDER BY a.created_at DESC
LIMIT 20;
```

**Document processing status**:
```sql
SELECT
  processing_status,
  COUNT(*) as count
FROM documents
GROUP BY processing_status;
```

---

### B. Related Documentation

- [Phone Number Testing Guide](/docs/twilio/PHONE_NUMBER_TESTING_GUIDE.md)
- [Testing Mode](/docs/twilio/TESTING_MODE.md)
- [Database Schema](/docs/db_schema.sql)
- [Backend Integration](/docs/BACKEND_INTEGRATION_COMPLETE.md)
- [Wallet Documentation](/docs/wallet/)
- [Performance Optimization](/docs/performance/)

---

### C. Contact & Support

**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui`

**Voice Agent Service**: `https://github.com/radhagarine/airavoiceagent`

**Questions**: See project README.md or create an issue in the repository

---

**Document Version**: 1.0
**Last Updated**: October 18, 2025
**Next Review**: December 2025 (or when migrating to Phase 3)
