# How to Apply the Business Timezone Migration

## Current Status

✅ **Migration File Created:** `supabase/migrations/20251030000001_add_business_timezone.sql`
❌ **Migration Not Yet Applied:** You need to run it to add the `timezone` column to your database

## Steps to Apply Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Make sure you're in the project directory
cd /Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui

# 2. Apply the migration to your local Supabase instance
npx supabase db reset

# OR apply just this migration
npx supabase migration up
```

### Option 2: Apply to Production (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251030000001_add_business_timezone.sql`
4. Paste and run the SQL

### Option 3: Manual SQL Execution

If you're using Supabase locally or have direct database access:

```bash
# Connect to your database and run:
psql -h localhost -U postgres -d postgres

# Then paste this SQL:
ALTER TABLE business_v2
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN business_v2.timezone IS 'IANA timezone identifier for business location';

CREATE INDEX IF NOT EXISTS idx_business_v2_timezone ON business_v2(timezone);

UPDATE business_v2
SET timezone = 'America/New_York'
WHERE timezone IS NULL;
```

## What the Migration Does

1. **Adds `timezone` column** to `business_v2` table
   - Type: TEXT
   - Default: 'America/New_York'
   - Nullable: Yes

2. **Adds comment** for documentation

3. **Creates index** on timezone column for efficient queries

4. **Updates existing businesses** with default timezone

5. **Adds validation constraint** to ensure valid timezone format

## Verify Migration Applied

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'business_v2' AND column_name = 'timezone';

-- Check existing businesses have timezone
SELECT id, name, timezone FROM business_v2 LIMIT 5;
```

Expected output:
```
column_name | data_type | column_default
------------|-----------|-------------------
timezone    | text      | 'America/New_York'
```

## After Migration

Once the migration is applied:

1. ✅ All existing businesses will have timezone = 'America/New_York'
2. ✅ New businesses can set custom timezone in profile form
3. ✅ Voice bots can automatically use business timezone
4. ✅ Appointment service will fetch timezone from business_v2 table

## Important Notes

- **Backup First:** Always backup your database before running migrations
- **Test Locally:** Run on local/dev database first before production
- **No Downtime:** Migration is backward compatible - existing code still works
- **Default Safe:** 'America/New_York' is a safe default for US businesses

## If Migration Fails

Common issues and solutions:

### Issue: Column already exists
```
ERROR: column "timezone" of relation "business_v2" already exists
```
**Solution:** Migration uses `ADD COLUMN IF NOT EXISTS` - safe to re-run

### Issue: Constraint fails
```
ERROR: check constraint "business_v2_timezone_format_check" is violated
```
**Solution:** Some existing data doesn't match timezone format. Run:
```sql
-- Update invalid timezones
UPDATE business_v2 SET timezone = 'America/New_York' WHERE timezone !~ '^[A-Z][a-zA-Z_]*(/[A-Z][a-zA-Z_]*)*$';
```

### Issue: Permission denied
```
ERROR: permission denied for table business_v2
```
**Solution:** Run as database superuser or adjust permissions

## Next Steps After Migration

1. **Test in Profile Form:**
   - Go to `/dashboard/profile`
   - Create or edit a business
   - Verify timezone dropdown appears and saves

2. **Test Voice Appointment:**
   ```typescript
   const result = await appointmentService.createAppointmentFromVoice({
     business_id: 'your-business-id',
     user_id: 'user-id',
     natural_language_time: 'tomorrow 7 PM'
   });
   ```

3. **Verify Database:**
   ```sql
   SELECT id, name, timezone FROM business_v2;
   ```

---

**IMPORTANT:** The timezone feature won't work until you run this migration! The code is ready but needs the database column to exist.
