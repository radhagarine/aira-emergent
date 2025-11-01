# Timezone-Aware Appointment System - Implementation Guide

## Overview

This document describes the timezone-aware appointment system implemented in the AiRa platform. The system ensures that all appointment times are stored in UTC in the database and displayed in the user's local timezone in the UI.

## Problem Solved

**Before:** When users booked appointments via voice bot or UI, times were stored without proper timezone handling, leading to:
- Incorrect appointment times displayed in calendar
- Confusion for users in different timezones
- Issues with appointment scheduling across timezones

**After:** Appointments are now:
- Stored in UTC in the database (industry best practice)
- Displayed in user's local timezone in the UI
- Support natural language time parsing for voice bot integration
- Work correctly for users in any timezone globally

## Architecture

### 1. Database Layer
- **Table:** `appointments_v2`
- **Time Fields:** `start_time`, `end_time` (both `TIMESTAMP WITH TIME ZONE`)
- **Storage:** All times stored as UTC
- **New Field:** `user_timezone` (TEXT) - stores IANA timezone identifier for reference

### 2. Utility Layer (`lib/utils/timezone.ts`)

Core timezone conversion functions using `date-fns-tz`:

```typescript
// Get user's browser timezone
getUserTimezone(): string

// Convert local time to UTC for storage
convertLocalToUTC(localDate: Date, timezone: string): string

// Convert UTC to local time for display
convertUTCToLocal(utcDate: Date | string, timezone: string): Date

// Parse natural language time ("tomorrow 10 AM") to UTC
parseNaturalTimeToUTC(text: string, timezone: string): string

// Format UTC date in specific timezone
formatLocalDateTime(utcDate: Date | string, timezone: string, format: string): string

// Format time only
formatTimeOnly(utcDate: Date | string, timezone: string, use24Hour: boolean): string
```

### 3. Service Layer (`lib/services/appointment/appointment.service.ts`)

Added timezone-aware methods:

```typescript
// Create appointment from voice bot with natural language time
async createAppointmentFromVoice(
  data: VoiceAppointmentCreateData
): Promise<{ success: boolean; message: string; appointment?: AppointmentResponse }>
```

### 4. UI Layer (`app/dashboard/calendar/`)

Calendar components now:
- Detect user's timezone automatically
- Display timezone information in header
- Convert all displayed times to user's timezone
- Show timezone abbreviation (e.g., IST, PST, EST)

## Usage Examples

### Example 1: Voice Bot Integration

```typescript
import { useAppointmentService } from '@/components/providers/service-provider';
import { getUserTimezone } from '@/lib/utils/timezone';

// In your voice bot handler
const appointmentService = useAppointmentService();
const userTimezone = getUserTimezone();

// User says: "Book appointment for tomorrow at 10 AM"
const result = await appointmentService.createAppointmentFromVoice({
  business_id: 'business-123',
  user_id: 'user-456',
  natural_language_time: 'tomorrow 10 AM',
  user_timezone: userTimezone,
  party_size: 2,
  duration_minutes: 60
});

if (result.success) {
  console.log(result.message);
  // "Appointment booked successfully on Thursday, October 31, 2025 at 10:00 AM"
}
```

### Example 2: Manual Appointment Creation

```typescript
import { useAppointmentService } from '@/components/providers/service-provider';
import { convertLocalToUTC, getUserTimezone } from '@/lib/utils/timezone';

const appointmentService = useAppointmentService();
const userTimezone = getUserTimezone();

// User selects Oct 31, 2025, 10:00 AM in their local timezone
const localStartTime = new Date(2025, 9, 31, 10, 0, 0);
const localEndTime = new Date(2025, 9, 31, 11, 0, 0);

// Convert to UTC before storing
const startTimeUTC = convertLocalToUTC(localStartTime, userTimezone);
const endTimeUTC = convertLocalToUTC(localEndTime, userTimezone);

await appointmentService.createAppointment({
  business_id: 'business-123',
  user_id: 'user-456',
  start_time: startTimeUTC,
  end_time: endTimeUTC,
  user_timezone: userTimezone,
  party_size: 2,
  status: 'pending'
});
```

### Example 3: Display Appointments in UI

```typescript
import { formatTimeOnly, formatDateOnly, getUserTimezone } from '@/lib/utils/timezone';

const userTimezone = getUserTimezone();

// Appointment from database (UTC time)
const appointment = {
  start_time: '2025-10-31T04:30:00.000Z', // UTC
  end_time: '2025-10-31T05:30:00.000Z'
};

// Display in user's timezone
const displayTime = formatTimeOnly(appointment.start_time, userTimezone);
// For IST user: "10:00 AM"

const displayDate = formatDateOnly(appointment.start_time, userTimezone, 'long');
// For IST user: "October 31, 2025"
```

## How It Works

### Flow 1: Voice Bot Creates Appointment

```
1. User (in IST) says: "book tomorrow 10 AM"
   ↓
2. Voice bot calls: createAppointmentFromVoice({
     natural_language_time: "tomorrow 10 AM",
     user_timezone: "Asia/Kolkata"
   })
   ↓
3. parseNaturalTimeToUTC() converts:
   - "tomorrow 10 AM" in IST
   - To: "2025-10-31T04:30:00.000Z" (UTC)
   ↓
4. Service stores in database:
   - start_time: "2025-10-31T04:30:00.000Z" (UTC)
   - user_timezone: "Asia/Kolkata"
   ↓
5. Database stores UTC time with TIMESTAMPTZ
```

### Flow 2: Calendar Displays Appointment

```
1. User opens Calendar tab
   ↓
2. Browser timezone detected: "Asia/Kolkata"
   ↓
3. Service fetches UTC times from database:
   - start_time: "2025-10-31T04:30:00.000Z"
   ↓
4. UI converts to local timezone:
   - formatTimeOnly(utc, "Asia/Kolkata")
   ↓
5. Calendar displays: "10:00 AM" ✅ (correct local time)
```

## Supported Natural Language Time Formats

| Input | Parsed As |
|-------|-----------|
| `tomorrow 10 AM` | Tomorrow at 10:00 AM in user's timezone |
| `today 3 PM` | Today at 3:00 PM in user's timezone |
| `12/25 at 2:30 PM` | December 25th at 2:30 PM in user's timezone |
| `10 AM` | Today at 10:00 AM in user's timezone |
| `14:00` | Today at 2:00 PM (24-hour format) |

## Timezone Examples

| User Timezone | User Says | Stored (UTC) | Display (User TZ) | Display (Other TZ) |
|---------------|-----------|--------------|-------------------|-------------------|
| IST (UTC+5:30) | tomorrow 10 AM | 2025-10-31T04:30:00Z | Oct 31, 10:00 AM | Oct 30, 9:30 PM (PST) |
| PST (UTC-8) | today 3 PM | 2025-10-29T22:00:00Z | Oct 29, 3:00 PM | Oct 30, 2:00 AM (IST) |
| EST (UTC-5) | 12/25 9 AM | 2025-12-25T14:00:00Z | Dec 25, 9:00 AM | Dec 25, 7:30 PM (IST) |

## Implementation Checklist

- [x] Install `date-fns-tz` package
- [x] Create timezone utility functions
- [x] Add timezone field to appointment types
- [x] Update appointment service with timezone-aware methods
- [x] Add voice bot appointment creation method
- [x] Update calendar UI to display user's timezone
- [x] Update calendar UI to show timezone abbreviation
- [x] Format all displayed times in user's timezone
- [ ] Add database migration for user_timezone field (optional)
- [ ] Create API endpoints for external voice bot integration
- [ ] Add unit tests for timezone utilities
- [ ] Add integration tests for appointment service

## Database Schema Updates (Optional)

If you want to add the `user_timezone` field to the database:

```sql
-- Add user_timezone column to appointments_v2 table
ALTER TABLE appointments_v2
ADD COLUMN user_timezone TEXT;

-- Add comment
COMMENT ON COLUMN appointments_v2.user_timezone IS 'IANA timezone identifier for reference (e.g., America/New_York, Asia/Kolkata)';

-- Create index if needed for timezone queries
CREATE INDEX IF NOT EXISTS idx_appointments_timezone ON appointments_v2(user_timezone);
```

Note: The database schema already uses `TIMESTAMP WITH TIME ZONE` which correctly stores UTC times, so the `user_timezone` field is optional and for reference only.

## Testing

### Manual Testing

1. **Test timezone detection:**
   ```javascript
   console.log(getUserTimezone());
   // Should output your timezone, e.g., "America/Los_Angeles"
   ```

2. **Test natural language parsing:**
   ```javascript
   const utc = parseNaturalTimeToUTC('tomorrow 10 AM', 'Asia/Kolkata');
   console.log(utc);
   // Should output tomorrow's date at 10 AM IST converted to UTC
   ```

3. **Test calendar display:**
   - Open calendar tab
   - Verify timezone is displayed in header
   - Create a test appointment
   - Verify time displays correctly in your timezone

### Automated Testing

See `tests/lib/utils/timezone.test.ts` for timezone utility tests (to be created).

## Common Issues & Solutions

### Issue 1: Wrong Time Displayed

**Symptoms:** Calendar shows time different from what user booked

**Solution:**
1. Check `start_time` in database is in UTC format
2. Verify user's browser timezone: `getUserTimezone()`
3. Ensure `TIMESTAMPTZ` column type in database

### Issue 2: Parsing Fails

**Symptoms:** Natural language time not parsing correctly

**Solution:**
1. Check supported format in `parseNaturalTimeToUTC()`
2. Test with simple format: "tomorrow 10 AM"
3. Add logging to see intermediate values

### Issue 3: Timezone Not Detected

**Symptoms:** Timezone shows as "UTC" instead of actual timezone

**Solution:**
1. Check browser permissions
2. Verify `Intl.DateTimeFormat` is supported
3. Fallback to manual timezone selection

## Dependencies

- **date-fns**: ^4.0.0 (date manipulation)
- **date-fns-tz**: ^3.2.0 (timezone conversions)

## Best Practices

1. **Always store times in UTC** in the database
2. **Convert to local timezone** only for display
3. **Include timezone information** in API responses
4. **Use IANA timezone identifiers** (e.g., "America/New_York")
5. **Test across multiple timezones** during development
6. **Document timezone handling** for external integrators

## API Integration Guide

For external services integrating with the appointment system:

### Create Appointment Endpoint

```bash
POST /api/appointments
Content-Type: application/json

{
  "business_id": "business-123",
  "user_id": "user-456",
  "start_time": "2025-10-31T04:30:00.000Z",  // UTC ISO string
  "end_time": "2025-10-31T05:30:00.000Z",
  "user_timezone": "Asia/Kolkata",  // IANA timezone identifier
  "party_size": 2,
  "status": "pending"
}
```

### Get Appointments Endpoint

```bash
GET /api/appointments?business_id=business-123&start=2025-10-30T00:00:00Z&end=2025-11-01T00:00:00Z

Response:
{
  "appointments": [
    {
      "id": "apt-789",
      "start_time": "2025-10-31T04:30:00.000Z",  // Always UTC
      "end_time": "2025-10-31T05:30:00.000Z",
      "user_timezone": "Asia/Kolkata"
    }
  ]
}
```

## Further Enhancements

Future improvements could include:

1. **User timezone preferences** - Allow users to override browser timezone
2. **Timezone conversion UI** - Show appointments in multiple timezones
3. **Smart timezone detection** - Detect timezone from phone number or location
4. **Recurring appointments** - Handle DST changes for recurring events
5. **Timezone-aware notifications** - Send reminders in user's timezone

## References

- [IANA Timezone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
- [PostgreSQL TIMESTAMPTZ](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

## Support

For questions or issues with timezone handling:
- Review this documentation
- Check implementation in `/lib/utils/timezone.ts`
- Review service layer in `/lib/services/appointment/appointment.service.ts`
- Check UI implementation in `/app/dashboard/calendar/AppointmentsCalendar.tsx`
