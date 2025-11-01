/**
 * List of common timezones grouped by region
 * Used for timezone selector in business profile forms
 */

export interface TimezoneOption {
  value: string; // IANA timezone identifier
  label: string; // Display label
  offset: string; // UTC offset
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // US Timezones
  { value: 'America/New_York', label: 'Eastern Time (US)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (US)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (US)', offset: 'UTC-7/-6' },
  { value: 'America/Phoenix', label: 'Arizona (No DST)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)', offset: 'UTC-8/-7' },
  { value: 'America/Anchorage', label: 'Alaska Time', offset: 'UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', offset: 'UTC-10' },

  // Canada
  { value: 'America/Toronto', label: 'Eastern Time (Canada)', offset: 'UTC-5/-4' },
  { value: 'America/Vancouver', label: 'Pacific Time (Canada)', offset: 'UTC-8/-7' },

  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: 'UTC+3' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8' },

  // Australia
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', offset: 'UTC+10/+11' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT/AEST)', offset: 'UTC+10/+11' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', offset: 'UTC+8' },

  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', offset: 'UTC-3' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)', offset: 'UTC-6' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: 'UTC+2' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: 'UTC+1' },

  // Middle East
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', offset: 'UTC+2' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)', offset: 'UTC+3' },

  // Pacific
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)', offset: 'UTC+12/+13' },
  { value: 'Pacific/Fiji', label: 'Fiji (FJT)', offset: 'UTC+12' },
];

/**
 * Get timezone option by IANA identifier
 */
export function getTimezoneOption(timezone: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
}

/**
 * Get current UTC offset for a timezone
 */
export function getCurrentOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');

    if (offsetPart && offsetPart.value.includes('GMT')) {
      return offsetPart.value.replace('GMT', 'UTC');
    }

    return 'UTC+0';
  } catch {
    return 'UTC+0';
  }
}

/**
 * Group timezones by region for organized display
 */
export const TIMEZONE_GROUPS = {
  'United States': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('America/') &&
    ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage'].includes(tz.value) ||
    tz.value.startsWith('Pacific/Honolulu')
  ),
  'Canada': TIMEZONE_OPTIONS.filter(tz => ['America/Toronto', 'America/Vancouver'].includes(tz.value)),
  'Europe': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Europe/')),
  'Asia': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Asia/')),
  'Australia': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Australia/')),
  'Americas': TIMEZONE_OPTIONS.filter(tz =>
    tz.value.startsWith('America/') &&
    !['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
      'America/Los_Angeles', 'America/Anchorage', 'America/Toronto', 'America/Vancouver'].includes(tz.value)
  ),
  'Africa': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Africa/')),
  'Pacific': TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Pacific/') && tz.value !== 'Pacific/Honolulu'),
};
