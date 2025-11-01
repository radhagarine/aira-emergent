/**
 * Timezone utility functions for handling timezone conversions
 *
 * This module provides functions to:
 * - Detect user's browser timezone
 * - Convert times between local timezone and UTC
 * - Parse natural language time expressions
 * - Format dates in specific timezones
 *
 * All times are stored in the database as UTC (TIMESTAMP WITH TIME ZONE)
 * and converted to user's local timezone for display.
 */

import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { parse, format, addDays, setHours, setMinutes } from 'date-fns';

/**
 * Get the user's timezone from the browser
 * @returns The IANA timezone identifier (e.g., "America/New_York", "Asia/Kolkata")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to get user timezone, defaulting to UTC:', error);
    return 'UTC';
  }
}

/**
 * Get the timezone abbreviation (e.g., "PST", "IST", "EDT")
 * @param timezone - The IANA timezone identifier
 * @param date - The date to get the abbreviation for (defaults to now)
 * @returns The timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart?.value || '';
  } catch (error) {
    console.warn('Failed to get timezone abbreviation:', error);
    return '';
  }
}

/**
 * Convert a local date/time to UTC for database storage
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param timezone - The IANA timezone identifier
 * @returns ISO 8601 string in UTC
 *
 * @example
 * // User in IST wants to book Oct 31, 2025 at 10:00 AM
 * const utc = localToUTC(2025, 10, 31, 10, 0, 'Asia/Kolkata')
 * // Returns: "2025-10-31T04:30:00.000Z" (10 AM IST = 4:30 AM UTC)
 */
export function localToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): string {
  // Create a date object representing the local time
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  // Convert local time to UTC
  const utcDate = fromZonedTime(localDate, timezone);

  return utcDate.toISOString();
}

/**
 * Convert a Date object from local timezone to UTC
 *
 * @param localDate - The date in local timezone
 * @param timezone - The IANA timezone identifier
 * @returns ISO 8601 string in UTC
 */
export function convertLocalToUTC(localDate: Date, timezone: string): string {
  const utcDate = fromZonedTime(localDate, timezone);
  return utcDate.toISOString();
}

/**
 * Convert a UTC date to a specific timezone
 *
 * @param utcDate - The UTC date (as Date object or ISO string)
 * @param timezone - The IANA timezone identifier
 * @returns Date object in the target timezone
 */
export function convertUTCToLocal(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Format a UTC date in a specific timezone
 *
 * @param utcDate - The UTC date (as Date object or ISO string)
 * @param timezone - The IANA timezone identifier
 * @param formatType - 'short', 'medium', 'long', or a custom format string
 * @returns Formatted date string
 *
 * @example
 * const display = formatLocalDateTime('2025-10-31T04:30:00.000Z', 'Asia/Kolkata', 'short')
 * // Returns: "Oct 31, 2025, 10:00 AM"
 */
export function formatLocalDateTime(
  utcDate: Date | string,
  timezone: string,
  formatType: 'short' | 'medium' | 'long' | string = 'medium'
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  let formatString: string;

  switch (formatType) {
    case 'short':
      formatString = 'MMM d, yyyy, h:mm a';
      break;
    case 'medium':
      formatString = 'MMMM d, yyyy h:mm a';
      break;
    case 'long':
      formatString = 'EEEE, MMMM d, yyyy \'at\' h:mm a';
      break;
    default:
      formatString = formatType;
  }

  return formatInTimeZone(date, timezone, formatString);
}

/**
 * Parse natural language time expressions and convert to UTC
 *
 * Supported formats:
 * - "tomorrow 10 AM" or "tomorrow 10:00 AM"
 * - "today 3 PM" or "today 15:00"
 * - "12/25 at 2:30 PM"
 * - "10 AM" (assumes today)
 * - "14:00" (assumes today, 24-hour format)
 *
 * @param text - Natural language time expression
 * @param timezone - The IANA timezone identifier
 * @returns ISO 8601 string in UTC
 *
 * @example
 * const utc = parseNaturalTimeToUTC('tomorrow 10 AM', 'Asia/Kolkata')
 * // Returns: "2025-10-31T04:30:00.000Z" (if today is Oct 30)
 */
export function parseNaturalTimeToUTC(text: string, timezone: string): string {
  const now = new Date();
  const lowerText = text.toLowerCase().trim();

  let targetDate = new Date();
  let hour = 0;
  let minute = 0;

  // Parse relative day (tomorrow, today)
  if (lowerText.includes('tomorrow')) {
    targetDate = addDays(now, 1);
  } else if (lowerText.includes('today')) {
    targetDate = now;
  }

  // Parse date like "12/25" or "12-25"
  const dateMatch = lowerText.match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    targetDate = new Date(now.getFullYear(), month - 1, day);
  }

  // Parse time - try 12-hour format first (e.g., "10 AM", "10:30 PM")
  const time12Match = lowerText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (time12Match) {
    hour = parseInt(time12Match[1], 10);
    minute = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const isPM = time12Match[3].toLowerCase() === 'pm';

    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }
  } else {
    // Try 24-hour format (e.g., "14:30", "9:00")
    const time24Match = lowerText.match(/(\d{1,2}):(\d{2})/);
    if (time24Match) {
      hour = parseInt(time24Match[1], 10);
      minute = parseInt(time24Match[2], 10);
    } else {
      // Just a number, assume AM/PM context from text or default to current hour
      const numberMatch = lowerText.match(/\b(\d{1,2})\b/);
      if (numberMatch) {
        hour = parseInt(numberMatch[1], 10);
        // If hour is less than 7, assume PM (business hours)
        if (hour < 7 && !lowerText.includes('am')) {
          hour += 12;
        }
      }
    }
  }

  // Set the time on the target date
  targetDate.setHours(hour, minute, 0, 0);

  // Convert from local timezone to UTC
  return convertLocalToUTC(targetDate, timezone);
}

/**
 * Get the UTC offset for a timezone at a specific date
 *
 * @param timezone - The IANA timezone identifier
 * @param date - The date to get the offset for (defaults to now)
 * @returns Offset string like "+05:30" or "-08:00"
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');

    if (offsetPart && offsetPart.value.includes('GMT')) {
      // Extract offset like "GMT+5:30" -> "+05:30"
      const offset = offsetPart.value.replace('GMT', '');
      return offset || '+00:00';
    }

    return '+00:00';
  } catch (error) {
    console.warn('Failed to get timezone offset:', error);
    return '+00:00';
  }
}

/**
 * Check if a date is in the past relative to a timezone
 *
 * @param date - The date to check
 * @param timezone - The IANA timezone identifier
 * @returns true if the date is in the past
 */
export function isDateInPast(date: Date | string, timezone: string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const nowInTimezone = toZonedTime(new Date(), timezone);
  const targetInTimezone = toZonedTime(targetDate, timezone);

  return targetInTimezone < nowInTimezone;
}

/**
 * Format a time only (no date) in a specific timezone
 *
 * @param utcDate - The UTC date (as Date object or ISO string)
 * @param timezone - The IANA timezone identifier
 * @param use24Hour - Use 24-hour format (default: false)
 * @returns Formatted time string like "10:00 AM" or "14:00"
 */
export function formatTimeOnly(
  utcDate: Date | string,
  timezone: string,
  use24Hour: boolean = false
): string {
  const formatString = use24Hour ? 'HH:mm' : 'h:mm a';
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return formatInTimeZone(date, timezone, formatString);
}

/**
 * Format a date only (no time) in a specific timezone
 *
 * @param utcDate - The UTC date (as Date object or ISO string)
 * @param timezone - The IANA timezone identifier
 * @param formatType - 'short', 'medium', 'long'
 * @returns Formatted date string
 */
export function formatDateOnly(
  utcDate: Date | string,
  timezone: string,
  formatType: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  let formatString: string;
  switch (formatType) {
    case 'short':
      formatString = 'M/d/yyyy';
      break;
    case 'medium':
      formatString = 'MMM d, yyyy';
      break;
    case 'long':
      formatString = 'MMMM d, yyyy';
      break;
    default:
      formatString = 'MMM d, yyyy';
  }

  return formatInTimeZone(date, timezone, formatString);
}
