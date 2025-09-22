// tests/utils/appointment-test-helpers.ts
import { AppointmentService } from '@/lib/services/appointment/appointment.service';
import { DateRange } from '@/lib/services/appointment/types';

/**
 * Test helpers for working with the AppointmentService in tests
 */
export const appointmentServiceTestHelpers = {
  /**
   * Utility to make a cache key that matches the one created internally
   * by the AppointmentService for getAppointments
   */
  makeAppointmentsCacheKey(businessId: string, dateRange: DateRange): string {
    return `appointments:${businessId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
  },

  /**
   * Force a cache entry to expire by setting its age to -1
   */
  expireCache(service: AppointmentService, key: string): void {
    service._testOnlySetCacheAge(key, -1);
  },

  /**
   * Clear all caches in the service
   */
  clearAllCaches(service: AppointmentService): void {
    service._testOnlyClearCache();
  },

  /**
   * Get the current size of the cache
   */
  getCacheSize(service: AppointmentService): number {
    return service._testOnlyGetCacheSize();
  },

  /**
   * Create a date range for testing
   */
  createDateRange(startDate: Date, daysAhead: number = 1): DateRange {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);
    endDate.setHours(23, 59, 59, 999);
    
    return {
      start: startDate,
      end: endDate
    };
  },

  /**
   * Run a function with test mode enabled for a service
   */
  withTestMode<T>(service: AppointmentService, fn: () => T): T {
    // Enable test mode
    service._setTestMode(true);
    try {
      return fn();
    } finally {
      // Reset test mode
      service._setTestMode(false);
    }
  }
};