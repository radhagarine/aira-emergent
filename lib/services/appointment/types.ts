// src/lib/services/appointment/types.ts
import { AppointmentStatus } from '@/lib/types/database/business.types';

/**
 * Date range for filtering appointments
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Business capacity information
 */
export interface BusinessCapacity {
  date: string;
  totalCapacity: number;
  bookedCapacity: number;
  utilizationPercentage: number;
}

/**
 * Utilization summary 
 */
export interface UtilizationSummary {
  totalAppointments: number;
  averageUtilization: number;
  dailyUtilization: Record<string, number>;
  peakHours: string[];
  slowHours: string[];
}

/**
 * Appointment data as returned by the service
 */
export interface AppointmentResponse {
  id: string;
  business_id: string;
  user_id: string;
  start_time: string; // Always stored as UTC ISO string
  end_time: string; // Always stored as UTC ISO string
  description: string | null;
  party_size: number;
  status: AppointmentStatus;
  user_timezone?: string; // IANA timezone identifier for reference (e.g., "America/New_York")
  created_at: string;
  updated_at: string;
}

/**
 * Data for creating a new appointment
 */
export interface AppointmentCreateData {
  business_id: string;
  user_id: string;
  start_time: string | Date; // Will be converted to UTC before storage
  end_time: string | Date; // Will be converted to UTC before storage
  description?: string | null;
  party_size?: number;
  status?: AppointmentStatus;
  user_timezone?: string; // IANA timezone identifier (optional, defaults to browser timezone)
}

/**
 * Data for updating an existing appointment
 */
export interface AppointmentUpdateData {
  start_time?: string | Date; // Will be converted to UTC before storage
  end_time?: string | Date; // Will be converted to UTC before storage
  description?: string | null;
  party_size?: number;
  status?: AppointmentStatus;
  user_timezone?: string; // IANA timezone identifier
}

/**
 * Combined calendar data including appointments and capacity
 */
export interface CalendarData {
  appointments: AppointmentResponse[];
  capacity: BusinessCapacity;
}

/**
 * Data for creating an appointment from voice bot with natural language time
 */
export interface VoiceAppointmentCreateData {
  business_id: string;
  user_id: string;
  natural_language_time: string; // e.g., "tomorrow 10 AM", "today 3 PM"
  user_timezone?: string; // IANA timezone identifier (optional - will use business timezone if not provided)
  description?: string | null;
  party_size?: number;
  status?: AppointmentStatus;
  duration_minutes?: number; // Duration in minutes (default: 60)
}

/**
 * Appointment service interface
 */
export interface IAppointmentService {
  /**
   * Get appointments for a business within a date range
   */
  getAppointments(
    businessId: string, 
    dateRange: DateRange
  ): Promise<AppointmentResponse[]>;

  /**
   * Get calendar data including appointments and capacity
   */
  getCalendarData(
    businessId: string, 
    dateRange: DateRange
  ): Promise<CalendarData>;

  /**
   * Get a single appointment by ID
   */
  getAppointmentById(id: string): Promise<AppointmentResponse>;

  /**
   * Create a new appointment
   */
  createAppointment(data: AppointmentCreateData): Promise<AppointmentResponse>;

  /**
   * Update an existing appointment
   */
  updateAppointment(id: string, data: AppointmentUpdateData): Promise<AppointmentResponse>;

  /**
   * Delete an appointment
   */
  deleteAppointment(id: string): Promise<void>;

  /**
   * Get appointments by status
   */
  getAppointmentsByStatus(
    businessId: string, 
    status: AppointmentStatus,
    dateRange?: DateRange
  ): Promise<AppointmentResponse[]>;

  /**
   * Check if a time slot is available
   */
  isTimeSlotAvailable(
    businessId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean>;

  /**
   * Get business capacity for a specific date
   */
  getBusinessCapacity(
    businessId: string,
    date: Date
  ): Promise<BusinessCapacity>;

  /**
   * Get utilization summary over a period
   */
  getUtilizationSummary(
    businessId: string,
    dateRange: DateRange
  ): Promise<UtilizationSummary>;

  /**
   * Create an appointment from voice bot with natural language time parsing
   */
  createAppointmentFromVoice(
    data: VoiceAppointmentCreateData
  ): Promise<{ success: boolean; message: string; appointment?: AppointmentResponse }>;

  /**
   * Testing utility to enable test mode
   * @internal For testing purposes only
   */
  _setTestMode(isTestMode: boolean): void;
  
  /**
   * Testing utility to set cache age
   * @internal For testing purposes only
   */
  _testOnlySetCacheAge(key: string, ageInMs: number): void;
  
  /**
   * Testing utility to clear cache
   * @internal For testing purposes only
   */
  _testOnlyClearCache(): void;
  
  /**
   * Testing utility to get cache size
   * @internal For testing purposes only
   */
  _testOnlyGetCacheSize(): number;
}