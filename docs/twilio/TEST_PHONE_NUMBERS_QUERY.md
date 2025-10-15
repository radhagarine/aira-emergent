# Testing Phone Numbers Query

## Test 1: Check if business_numbers table exists

Go to Supabase Dashboard → SQL Editor and run:

```sql
SELECT COUNT(*) FROM business_numbers;
```

**Expected Result:**
- If table exists: Returns a count (probably 0)
- If table doesn't exist: ERROR: relation "business_numbers" does not exist

## Test 2: Check your user_id

In browser console on /dashboard/numbers page, run:

```javascript
// Get your user ID
const user = JSON.parse(localStorage.getItem('sb-wydvhmmsauoseyquxbfs-auth-token'))
console.log('User ID:', user?.user?.id)
```

## Test 3: Check if any phone numbers exist

In Supabase SQL Editor:

```sql
SELECT * FROM business_numbers;
```

**Expected Result:** Probably empty (0 rows)

## Test 4: Check RLS policies

In Supabase SQL Editor:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'business_numbers';
```

## Test 5: Manual test - Add a dummy phone number

First, get your business_id:

```sql
SELECT id, name FROM business_v2
WHERE user_id = 'YOUR_USER_ID_FROM_TEST_2';
```

Then insert a test number:

```sql
INSERT INTO business_numbers (
  id,
  business_id,
  phone_number,
  display_name,
  country_code,
  is_primary,
  is_active,
  number_type,
  provider,
  purchase_date,
  monthly_cost
) VALUES (
  gen_random_uuid(),
  'YOUR_BUSINESS_ID_FROM_ABOVE',
  '+15551234567',
  'Test Number',
  'US',
  true,
  true,
  'local',
  'twilio',
  now(),
  5.00
);
```

## Test 6: Verify it shows in UI

Refresh /dashboard/numbers - you should now see the test number!

---

## Most Likely Issue

You probably just don't have any phone numbers yet because:
1. The "Buy phone number" feature requires Twilio/Stripe integration
2. You haven't manually added any test data

**Solution**: Either add a test number manually (Test 5 above) OR set up the full Twilio integration to actually purchase numbers.
