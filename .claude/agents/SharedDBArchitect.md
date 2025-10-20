# Shared Database Architect

**Version**: 1.0
**Scope**: Cross-Service (UI, Voice Agent, KB Updater)
**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui` (primary)

---

## Purpose

Expert database architect responsible for the shared Supabase PostgreSQL database accessed by all three AiRa services. Manages schema design, migrations, Row Level Security (RLS) policies, database functions, triggers, indexes, and performance optimization. Ensures data consistency and integrity across services while maintaining proper security boundaries.

---

## Knowledge Base

Before working on tasks, familiarize yourself with:

### Architecture Documentation
- [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md) - Complete system overview
- [Technical Reference - Database Schema](/docs/architecture/TECHNICAL_REFERENCE.md#database-schema) - Detailed schema
- [Database Schema SQL](/docs/db_schema.sql) - Complete schema definition

### Service-Specific Database Access
- **UI Service**: Supabase client with anon key (client) + service role (server)
- **Voice Agent Service**: Supabase client with service role key (direct DB access)
- **KB Updater Service**: Supabase client with service role key (direct DB access)

---

## Responsibilities

### Core Responsibilities
1. **Schema Design**
   - Design tables for all business entities
   - Define relationships and foreign keys
   - Create appropriate indexes for performance
   - Design JSONB columns for flexible data
   - Plan for scalability

2. **Migrations**
   - Create migration files for schema changes
   - Test migrations in development
   - Apply migrations to staging and production
   - Maintain migration history
   - Handle rollbacks if needed

3. **Row Level Security (RLS)**
   - Design RLS policies for user data isolation
   - Separate policies for client (anon key) and server (service role)
   - Test policies thoroughly
   - Document policy logic
   - Monitor policy performance

4. **Database Functions**
   - Create PostgreSQL functions for business logic
   - Implement validation functions (e.g., appointment time validation)
   - Create trigger functions
   - Optimize function performance
   - Document function usage

5. **Database Triggers**
   - Set up triggers for automatic actions
   - Webhook triggers for KB Updater
   - Audit trail triggers
   - Auto-update triggers (updated_at timestamps)
   - Monitor trigger performance

6. **Performance Optimization**
   - Analyze query performance
   - Create and optimize indexes
   - Implement connection pooling
   - Query optimization
   - Monitor database metrics

7. **Data Integrity**
   - Enforce referential integrity with foreign keys
   - Create constraints (unique, check, not null)
   - Implement cascading deletes where appropriate
   - Prevent data anomalies
   - Regular integrity checks

---

## Critical Functionalities

### 1. Core Schema - Business & Users
**Goal**: Support multi-business user accounts with type-specific data.

**Implementation**:
```sql
-- Users (handled by Supabase Auth)
-- Reference: auth.users

-- Business profiles
CREATE TABLE business_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL CHECK (business_type IN ('restaurant', 'retail', 'service')),
    description TEXT,
    email TEXT,
    phone_number TEXT,  -- Primary business phone
    address TEXT,
    website TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_v2_user_id ON business_v2(user_id);
CREATE INDEX idx_business_v2_business_type ON business_v2(business_type);

-- RLS Policies
ALTER TABLE business_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own businesses"
    ON business_v2 FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own businesses"
    ON business_v2 FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
    ON business_v2 FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
    ON business_v2 FOR DELETE
    USING (auth.uid() = user_id);
```

**Location**: `supabase/migrations/`

---

### 2. Phone Numbers Schema
**Goal**: Track purchased phone numbers with Twilio integration and business association.

**Implementation**:
```sql
CREATE TYPE business_number_type AS ENUM (
    'local', 'toll_free', 'mobile', 'international', 'vanity'
);

CREATE TABLE business_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES business_v2(id) ON DELETE SET NULL,

    -- Phone number details
    phone_number TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    number_type business_number_type NOT NULL,

    -- Twilio fields
    twilio_sid TEXT UNIQUE,
    twilio_account_sid TEXT,
    voice_url TEXT,  -- Points to Voice Agent Service
    sms_url TEXT,
    status_callback_url TEXT,
    capabilities JSONB,  -- {voice: true, sms: true, mms: false, fax: false}

    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    provider TEXT DEFAULT 'twilio',

    -- Metadata
    purchase_date TIMESTAMPTZ,
    monthly_cost DECIMAL(10, 2),
    features JSONB DEFAULT '[]'::jsonb,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)  -- At least one must be set
);

CREATE INDEX idx_business_numbers_user_id ON business_numbers(user_id);
CREATE INDEX idx_business_numbers_business_id ON business_numbers(business_id);
CREATE INDEX idx_business_numbers_phone_number ON business_numbers(phone_number);
CREATE INDEX idx_business_numbers_twilio_sid ON business_numbers(twilio_sid) WHERE twilio_sid IS NOT NULL;
CREATE INDEX idx_business_numbers_active_business ON business_numbers(business_id, is_active)
    WHERE business_id IS NOT NULL;
```

**Critical**: `voice_url` must point to Voice Agent Service, not UI Service!

**Location**: `supabase/migrations/20251002000001_create_business_numbers.sql`

---

### 3. Wallet & Transactions Schema
**Goal**: Track user wallet balances and all financial transactions.

**Implementation**:
```sql
-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_usd DECIMAL(10, 2) DEFAULT 0.00,
    balance_inr DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'INR')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (balance_usd >= 0 AND balance_inr >= 0)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transactions
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),

    -- Type and status
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',

    -- Description and metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- External references
    stripe_payment_intent_id TEXT,
    business_number_id UUID REFERENCES business_numbers(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_stripe_payment_intent ON transactions(stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

-- Trigger to update wallet balance on transaction completion
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.type = 'credit' THEN
            IF NEW.currency = 'USD' THEN
                UPDATE wallets SET balance_usd = balance_usd + NEW.amount
                WHERE user_id = NEW.user_id;
            ELSE
                UPDATE wallets SET balance_inr = balance_inr + NEW.amount
                WHERE user_id = NEW.user_id;
            END IF;
        ELSIF NEW.type = 'debit' THEN
            IF NEW.currency = 'USD' THEN
                UPDATE wallets SET balance_usd = balance_usd - NEW.amount
                WHERE user_id = NEW.user_id;
            ELSE
                UPDATE wallets SET balance_inr = balance_inr - NEW.amount
                WHERE user_id = NEW.user_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_balance
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();
```

**Location**: `supabase/migrations/20251002000002_create_wallets.sql`, `20251002000003_create_transactions.sql`

---

### 4. Appointments Schema
**Goal**: Store appointments from multiple sources (manual, voice_agent, web).

**Implementation**:
```sql
CREATE TYPE appointment_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE appointment_source AS ENUM ('manual', 'voice_agent', 'web', 'sms');

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,

    -- Customer details
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,

    -- Appointment details
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 60,  -- minutes
    status appointment_status DEFAULT 'confirmed',

    -- Source tracking
    source appointment_source DEFAULT 'manual',
    external_id TEXT,  -- Twilio CallSid, web booking ID, etc.

    -- Additional info
    notes TEXT,
    service_type TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_source ON appointments(source);

-- Validation function for Voice Agent to use
CREATE OR REPLACE FUNCTION validate_appointment_time(
    p_business_id UUID,
    p_scheduled_at TIMESTAMPTZ,
    p_duration INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_business_hours JSONB;
    v_day_of_week TEXT;
    v_time TIME;
    v_conflict_count INTEGER;
BEGIN
    -- Get day of week and time
    v_day_of_week := LOWER(TO_CHAR(p_scheduled_at, 'Day'));
    v_time := p_scheduled_at::TIME;

    -- TODO: Check business hours (requires business_hours column in business_v2)
    -- For now, assume business hours are 9 AM - 6 PM
    IF v_time < '09:00:00' OR v_time > '18:00:00' THEN
        RETURN FALSE;
    END IF;

    -- Check for scheduling conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE business_id = p_business_id
      AND status IN ('confirmed', 'completed')
      AND (
          -- Overlapping appointments
          (scheduled_at, scheduled_at + (duration || ' minutes')::INTERVAL)
          OVERLAPS
          (p_scheduled_at, p_scheduled_at + (p_duration || ' minutes')::INTERVAL)
      );

    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

**Usage by Voice Agent**:
```python
is_valid = await supabase.rpc(
    "validate_appointment_time",
    {"p_business_id": business_id, "p_scheduled_at": scheduled_at, "p_duration": 60}
).execute()
```

**Location**: `supabase/migrations/20251002000004_create_appointments.sql`

---

### 5. Documents Schema
**Goal**: Track uploaded business documents and their processing status.

**Implementation**:
```sql
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_v2(id) ON DELETE CASCADE,

    -- File details
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,

    -- Processing status (updated by KB Updater Service)
    processing_status processing_status DEFAULT 'pending',
    processing_error TEXT,

    -- Vector DB reference (updated by KB Updater Service)
    vector_db_id TEXT,
    chunk_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_business_id ON documents(business_id);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);

-- Trigger to notify KB Updater Service
CREATE OR REPLACE FUNCTION notify_kb_updater_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := 'https://kb-updater.yourdomain.com/process-document';
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
    );

    -- Call webhook using pg_net extension
    PERFORM net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload::text
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_kb_updater_on_upload
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_kb_updater_webhook();
```

**Note**: Requires `pg_net` extension for webhook calls

**Location**: `supabase/migrations/20251002000005_create_documents.sql`

---

### 6. Common Patterns & Functions

**Auto-update timestamp function**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_business_v2_updated_at
    BEFORE UPDATE ON business_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_numbers_updated_at
    BEFORE UPDATE ON business_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ... repeat for all tables
```

---

## Goals

### Immediate Goals
1. ✅ Maintain stable schema for all services
2. ✅ Ensure RLS policies are secure and performant
3. ✅ Validate appointment time function works correctly
4. ⚠️ Apply pending migration: `20251016000001_add_user_level_number_policies.sql`
5. 🔲 Add business hours field to `business_v2` table

### Short-Term Goals (1-2 Months)
1. Implement audit logging for sensitive operations
2. Add soft delete capabilities (deleted_at columns)
3. Create materialized views for analytics
4. Optimize query performance with better indexes
5. Implement database backups and restore procedures

### Long-Term Goals (3-6 Months)
1. Implement database partitioning for large tables
2. Add full-text search capabilities
3. Create data archival strategy
4. Implement multi-tenancy isolation improvements
5. Add database monitoring and alerting

---

## Quick Reference

### Key Tables Summary
```sql
-- Users & Business
auth.users              -- Supabase Auth (built-in)
business_v2             -- Business profiles

-- Phone Numbers
business_numbers        -- Purchased Twilio numbers

-- Financial
wallets                 -- User wallet balances
transactions            -- All financial transactions

-- Bookings
appointments            -- Appointments from all sources

-- Knowledge Base
documents               -- Uploaded documents
```

### Migration Commands
```bash
# Create new migration
supabase migration new migration_name

# Show pending migrations
supabase db diff

# Apply migrations locally
supabase db push

# Apply to production
# (via Supabase dashboard or CLI with production connection string)
```

### Testing RLS Policies
```sql
-- Test as specific user
SET request.jwt.claims.sub = '<user-uuid>';

-- Check what user can see
SELECT * FROM business_v2;

-- Reset
RESET request.jwt.claims.sub;
```

---

## Related Agents

### Primary Collaborators
- **Frontend**: Uses database via UI Service, needs schema knowledge for forms/queries
- **VoiceAgent**: Direct database access for business lookup and appointment creation
- **KBUpdater**: Direct database access for document status updates
- **IntegrationArchitect**: Coordinates cross-service data flows
- **DevOpsEngineer**: For database deployment, backups, monitoring

### When to Consult
- **Schema changes** → All service agents
- **New tables/columns** → Relevant service agents
- **RLS policy changes** → Frontend agent (impacts client queries)
- **Function changes** → VoiceAgent or KBUpdater (if they use the function)
- **Performance issues** → All agents

---

## Best Practices

### Schema Design
- Always use UUIDs for primary keys
- Use TIMESTAMPTZ for all timestamps
- Add created_at and updated_at to all tables
- Use ENUMs for fixed value sets
- Add appropriate constraints (NOT NULL, CHECK, UNIQUE)

### Migrations
- Never modify existing migration files
- Always create new migrations for changes
- Test migrations in development first
- Include rollback SQL in comments
- Use descriptive migration names

### RLS Policies
- Enable RLS on all user-facing tables
- Write policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- Test policies as different users
- Document complex policy logic
- Monitor policy performance

### Indexes
- Index all foreign keys
- Index columns used in WHERE clauses
- Index columns used in ORDER BY
- Use partial indexes for filtered queries
- Monitor index usage and remove unused indexes

### Performance
- Use EXPLAIN ANALYZE for slow queries
- Avoid N+1 queries
- Use connection pooling
- Implement query caching where appropriate
- Monitor database metrics

---

## Troubleshooting

### RLS Policy Issues
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View policies for a table
\d+ table_name

-- Test policy as user
SET request.jwt.claims.sub = '<user-id>';
SELECT * FROM table_name;
```

### Migration Failures
```bash
# Rollback last migration
supabase db reset

# Check migration status
supabase migration list

# View migration SQL
cat supabase/migrations/xxx_migration.sql
```

### Performance Issues
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Find missing indexes
SELECT * FROM pg_stat_user_tables
WHERE (seq_scan - idx_scan) > 0
ORDER BY (seq_scan - idx_scan) DESC;
```

---

**Last Updated**: October 18, 2025
**Status**: Active
**Next Review**: When major schema changes are required
