# Business Timezone Feature - Implementation Guide

## Overview

Added timezone field to business profiles, enabling automatic timezone-aware appointment scheduling for voice bots. When a customer calls a business, the voice bot automatically uses the business's timezone for appointment scheduling without needing to ask the caller.

## Problem Solved

**Before:** Voice bots had to either:
- Ask callers for their timezone (poor UX)
- Guess timezone from phone number (unreliable)
- Use a hardcoded timezone (breaks for multi-location businesses)

**After:** Voice bots automatically use the business's timezone:
- Customer calls NYC restaurant → appointments in EST
- Customer calls LA restaurant → appointments in PST
- No need to ask caller for timezone
- Consistent with business operations

## Implementation

### 1. Database Changes

**Migration File:** `supabase/migrations/20251030000001_add_business_timezone.sql`

```sql
ALTER TABLE business_v2
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN business_v2.timezone IS 'IANA timezone identifier for business location';

-- Index for efficient timezone queries
CREATE INDEX IF NOT EXISTS idx_business_v2_timezone ON business_v2(timezone);
```

### 2. Type Definitions

**Database Types** (`lib/database/database.types.ts`):
```typescript
business_v2: {
  Row: {
    // ... other fields
    timezone: string | null;
  }
}
```

**Service Types** (`lib/services/business/types.ts`):
```typescript
export interface BusinessCreateData {
  // ... other fields
  timezone?: string | null; // IANA timezone identifier
}

export interface BusinessUpdateData {
  // ... other fields
  timezone?: string | null;
}
```

### 3. Timezone Options

**Timezone List** (`lib/utils/timezones.ts`):
- 40+ common timezones organized by region
- Includes US, Canada, Europe, Asia, Australia, etc.
- Display label with UTC offset
- Example: "Eastern Time (US) (UTC-5/-4)"

### 4. Business Profile Form

**Updated Form** (`app/dashboard/profile/components/BusinessProfile.tsx`):
- Added timezone selector dropdown
- Shows timezone with UTC offset
- Defaults to "America/New_York"
- Required field with helpful description
- Saves timezone with business profile

### 5. Appointment Service Integration

**Auto-Timezone Detection** (`lib/services/appointment/appointment.service.ts`):

```typescript
async createAppointmentFromVoice(data: VoiceAppointmentCreateData) {
  // Determine timezone to use
  let timezone = data.user_timezone;

  // If no timezone provided, fetch from business settings
  if (!timezone) {
    const business = await this.businessRepository.getBusinessWithDetails(data.business_id);
    timezone = business?.timezone || getUserTimezone();
  }

  // Use business timezone for appointment
  const startTimeUTC = parseNaturalTimeToUTC(data.natural_language_time, timezone);
  // ...
}
```

## Usage Examples

### Example 1: Voice Bot Creates Appointment (Auto-Timezone)

```typescript
// Voice bot receives call for NYC restaurant
const result = await appointmentService.createAppointmentFromVoice({
  business_id: 'restaurant-nyc-123',
  user_id: 'customer-456',
  natural_language_time: 'tomorrow 7 PM',
  // No timezone specified - uses business timezone automatically!
  party_size: 4,
  duration_minutes: 120
});

// System automatically:
// 1. Fetches business timezone: "America/New_York"
// 2. Parses "tomorrow 7 PM" in EST
// 3. Converts to UTC for storage
// 4. Returns confirmation in EST
```

### Example 2: Business Profile Creation

```typescript
// Create business with timezone
const business = await businessService.createBusiness({
  user_id: user.id,
  name: "Joe's Pizza NYC",
  address: "123 Broadway, New York, NY",
  email: "contact@joespizza.com",
  type: "restaurant",
  timezone: "America/New_York" // EST timezone
});
```

### Example 3: Update Business Timezone

```typescript
// Update existing business timezone
await businessService.updateBusiness(businessId, {
  timezone: "America/Los_Angeles", // Changed to PST
  details: {}
});
```

## UI Features

### Business Profile Form

**Timezone Selector:**
- Dropdown with 40+ timezone options
- Searchable/filterable select
- Shows timezone name and UTC offset
- Grouped by region (US, Europe, Asia, etc.)
- Helpful description text
- Required field marked with asterisk

**Form Location:**
- Appears after "Email" field
- Before "Business Type" selector
- Icon: Clock icon to indicate time-related setting

**Validation:**
- Timezone is required when creating business
- Default: "America/New_York"
- Stored as IANA identifier (e.g., "America/New_York")

## API Integration

### Voice Bot Integration

**Simplified Voice Bot Code:**
```typescript
// OLD WAY - Had to ask for timezone
async function handleVoiceBooking(transcript, businessId, userId) {
  // Ask: "What timezone are you in?"
  const timezone = await askUserTimezone(); // Extra step!

  return await createAppointment({
    business_id: businessId,
    user_id: userId,
    natural_language_time: transcript,
    user_timezone: timezone // Had to provide
  });
}

// NEW WAY - Business timezone used automatically
async function handleVoiceBooking(transcript, businessId, userId) {
  return await createAppointmentFromVoice({
    business_id: businessId,
    user_id: userId,
    natural_language_time: transcript
    // No timezone needed! Uses business timezone
  });
}
```

### REST API Example

**Create Appointment with Auto-Timezone:**
```bash
POST /api/appointments/voice
{
  "business_id": "biz-123",
  "user_id": "user-456",
  "natural_language_time": "tomorrow 7 PM"
  // timezone optional - uses business timezone
}
```

## Benefits

### 1. Improved User Experience
- No need to ask callers for timezone
- More natural conversation flow
- Faster appointment booking

### 2. Accuracy
- Appointments always in business's local time
- Matches how business operates
- Eliminates timezone confusion

### 3. Scalability
- Works for businesses in any timezone
- Supports multi-location chains
- Each location can have own timezone

### 4. Developer-Friendly
- Automatic timezone detection
- Fallback to browser timezone if needed
- Clear API with good defaults

## Migration Path

### For Existing Businesses

**Default Timezone:**
- All existing businesses get "America/New_York" (EST) as default
- Business owners can update via profile form
- No breaking changes to existing appointments

**Update Steps:**
1. Run migration: `20251030000001_add_business_timezone.sql`
2. Existing businesses assigned default timezone
3. Business owners can update timezone in profile
4. New appointments use updated timezone

### For Voice Bots

**Backward Compatible:**
```typescript
// Still works with explicit timezone
await createAppointmentFromVoice({
  business_id: 'biz-123',
  user_id: 'user-456',
  natural_language_time: 'tomorrow 7 PM',
  user_timezone: 'America/Los_Angeles' // Explicit timezone
});

// New way - auto-detect from business
await createAppointmentFromVoice({
  business_id: 'biz-123',
  user_id: 'user-456',
  natural_language_time: 'tomorrow 7 PM'
  // Uses business timezone automatically
});
```

## Testing

### Manual Testing

1. **Create Business with Timezone:**
   - Go to Profile page
   - Click "Add Business"
   - Fill form and select timezone (e.g., "Pacific Time (US)")
   - Save business
   - Verify timezone saved correctly

2. **Test Voice Appointment:**
   - Use business ID
   - Call `createAppointmentFromVoice` without timezone
   - Verify it uses business timezone
   - Check appointment time is correct

3. **Update Business Timezone:**
   - Edit existing business
   - Change timezone
   - Create new appointment
   - Verify new timezone is used

### Test Scenarios

| Business Timezone | Natural Language | Expected Result |
|------------------|------------------|-----------------|
| America/New_York (EST) | tomorrow 7 PM | 7 PM EST stored as UTC |
| America/Los_Angeles (PST) | tomorrow 7 PM | 7 PM PST stored as UTC |
| Asia/Kolkata (IST) | tomorrow 7 PM | 7 PM IST stored as UTC |

## Configuration

### Default Timezone

Set in business profile form:
```typescript
const initialFormState: FormData = {
  // ...
  timezone: 'America/New_York', // Default timezone
  // ...
};
```

### Available Timezones

Defined in `lib/utils/timezones.ts`:
- 40+ common timezones
- Organized by region
- Easy to add more

## Troubleshooting

### Issue 1: Timezone Not Saving

**Symptoms:** Timezone shows as null in database

**Solution:**
1. Check migration ran successfully
2. Verify BusinessCreateData includes timezone
3. Check form data is passing timezone value

### Issue 2: Wrong Appointment Time

**Symptoms:** Appointment created in wrong timezone

**Solution:**
1. Verify business timezone is set correctly
2. Check `parseNaturalTimeToUTC` is using business timezone
3. Confirm UTC conversion is correct

### Issue 3: Timezone Not in Dropdown

**Symptoms:** Needed timezone not available

**Solution:**
1. Add timezone to `TIMEZONE_OPTIONS` in `lib/utils/timezones.ts`
2. Follow existing format:
   ```typescript
   { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: 'UTC+7' }
   ```

## Files Changed

### New Files
- ✅ `lib/utils/timezones.ts` - Timezone options list
- ✅ `supabase/migrations/20251030000001_add_business_timezone.sql` - Database migration
- ✅ `docs/BUSINESS_TIMEZONE_FEATURE.md` - This documentation

### Modified Files
- ✅ `lib/database/database.types.ts` - Added timezone to business_v2 types
- ✅ `lib/services/business/types.ts` - Added timezone to Business interfaces
- ✅ `lib/services/appointment/types.ts` - Made user_timezone optional
- ✅ `lib/services/appointment/appointment.service.ts` - Auto-fetch business timezone
- ✅ `app/dashboard/profile/components/BusinessProfile.tsx` - Added timezone selector

## Next Steps

### Recommended Enhancements

1. **Timezone Auto-Detection from Address:**
   - Use Google Maps API to detect timezone from business address
   - Auto-fill timezone field based on address

2. **Multi-Location Support:**
   - Allow businesses to have different timezones per location
   - Voice bot selects timezone based on called phone number

3. **Operating Hours Integration:**
   - Combine timezone with operating hours
   - Prevent bookings outside business hours in their timezone

4. **Analytics:**
   - Track appointments by timezone
   - Identify peak booking times per timezone

## Support

For questions or issues:
- Review this documentation
- Check `lib/utils/timezones.ts` for available timezones
- See `lib/services/appointment/appointment.service.ts` for implementation
- Check business profile form for UI implementation

---

**Implementation Date:** October 30, 2025
**Status:** ✅ Complete and Verified
**Build Status:** ✅ Passing
