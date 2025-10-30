# Business Timezone Feature - Quick Summary

## What Was Added

Added `timezone` field to business profiles so voice bots automatically use the business's timezone for appointment scheduling.

## Key Changes

### 1. Database
- **Added Column:** `timezone` to `business_v2` table
- **Type:** TEXT (IANA timezone identifier like "America/New_York")
- **Default:** "America/New_York"
- **Migration:** `supabase/migrations/20251030000001_add_business_timezone.sql`

### 2. Business Profile Form
- **New Field:** Timezone selector dropdown
- **Location:** After email field, before business type
- **Options:** 40+ timezones organized by region
- **Display:** Shows timezone name and UTC offset
- **Required:** Yes (defaults to Eastern Time)

### 3. Appointment Service
- **Auto-Detection:** Automatically fetches business timezone if not provided
- **Backward Compatible:** Still works with explicit timezone parameter
- **Fallback:** Uses browser timezone if business timezone not available

## How It Works

**Voice Bot Example:**
```typescript
// OLD: Had to provide timezone
await createAppointmentFromVoice({
  business_id: 'biz-123',
  user_id: 'user-456',
  natural_language_time: 'tomorrow 7 PM',
  user_timezone: 'America/New_York' // Required
});

// NEW: Automatic timezone from business
await createAppointmentFromVoice({
  business_id: 'biz-123',
  user_id: 'user-456',
  natural_language_time: 'tomorrow 7 PM'
  // No timezone needed! Uses business timezone
});
```

## Benefits

1. **Better UX:** No need to ask callers for timezone
2. **More Accurate:** Appointments match business operations
3. **Scalable:** Works for any timezone worldwide
4. **Simple:** Automatic with good defaults

## Files Changed

### New Files
- `lib/utils/timezones.ts` - 40+ timezone options
- `supabase/migrations/20251030000001_add_business_timezone.sql` - DB migration
- `docs/BUSINESS_TIMEZONE_FEATURE.md` - Full documentation
- `docs/BUSINESS_TIMEZONE_SUMMARY.md` - This summary

### Modified Files
- `lib/database/database.types.ts` - Added timezone to types
- `lib/services/business/types.ts` - Added timezone to interfaces
- `lib/services/appointment/types.ts` - Made user_timezone optional
- `lib/services/appointment/appointment.service.ts` - Auto-fetch business timezone
- `app/dashboard/profile/components/BusinessProfile.tsx` - Added timezone selector UI

## Testing

✅ **Build Status:** Passing with no errors
✅ **Backward Compatible:** Existing code still works
✅ **Default Value:** Existing businesses get "America/New_York"

### Manual Test Steps
1. Go to Profile page
2. Create/edit business
3. Select timezone from dropdown
4. Save business
5. Create appointment without specifying timezone
6. Verify appointment uses business timezone

## Migration Notes

### For Existing Businesses
- All existing businesses will have timezone = "America/New_York" (default)
- Business owners can update timezone in their profile
- No breaking changes to existing appointments

### For Voice Bot Developers
- `user_timezone` parameter is now optional in `createAppointmentFromVoice()`
- If not provided, system automatically uses business timezone
- Existing code with explicit timezone still works

## Quick Reference

**Available Timezones:** See `lib/utils/timezones.ts`
- US: Eastern, Central, Mountain, Pacific, Alaska, Hawaii
- Europe: London, Paris, Berlin, Moscow
- Asia: India, Singapore, Tokyo, Hong Kong, Dubai
- Australia: Sydney, Melbourne, Perth
- Americas: São Paulo, Mexico City, Buenos Aires
- Plus many more...

**Default Timezone:** America/New_York (EST/EDT)

**Database Field:** `business_v2.timezone` (TEXT, nullable, indexed)

**Service Method:** `appointmentService.createAppointmentFromVoice(data)`

---

**Status:** ✅ Complete
**Build:** ✅ Passing
**Date:** October 30, 2025
