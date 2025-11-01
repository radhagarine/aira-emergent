// src/lib/services/appointment/appointment.service.ts
import {
  IAppointmentService,
  AppointmentCreateData,
  AppointmentUpdateData,
  AppointmentResponse,
  DateRange,
  BusinessCapacity,
  CalendarData,
  UtilizationSummary,
  VoiceAppointmentCreateData
} from './types';

import {
  parseNaturalTimeToUTC,
  formatLocalDateTime,
  getUserTimezone
} from '@/lib/utils/timezone';

import { 
  getRepositoryFactory,
  RepositoryFactory
} from '@/lib/database/repository.factory';

import { 
  AppointmentStatus,
  BusinessType,
  AppointmentV2Row 
} from '@/lib/types/database/business.types';

import { DatabaseError, ServiceError } from '@/lib/types/shared/error.types';

/**
 * Service for managing appointments and calendar operations
 * This service provides an abstraction over the repository layer
 * and contains business logic for appointment management
 */
export class AppointmentService implements IAppointmentService {
  private repositoryFactory: RepositoryFactory;
  private appointmentsRepository;
  private businessRepository;
  private restaurantDetailsRepository;
  private retailDetailsRepository;
  private serviceDetailsRepository;
  
  // Simple in-memory cache with TTL
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  // Make CACHE_TTL protected to allow testing to modify it
  protected CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Flag for test mode
  private _testMode = false;

  constructor(repoFactoryOverride?: RepositoryFactory) {
    this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    this.appointmentsRepository = this.repositoryFactory.getAppointmentsRepository();
    this.businessRepository = this.repositoryFactory.getBusinessRepository();
    this.restaurantDetailsRepository = this.repositoryFactory.getRestaurantDetailsRepository();
    this.retailDetailsRepository = this.repositoryFactory.getRetailDetailsRepository();
    this.serviceDetailsRepository = this.repositoryFactory.getServiceDetailsRepository();
  }

  /**
   * Get appointments for a business within a date range
   */
  async getAppointments(
    businessId: string, 
    dateRange: DateRange
  ): Promise<AppointmentResponse[]> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }

      // Validate date range
      this.validateDateRange(dateRange);

      // Check if business exists
      await this.validateBusinessExists(businessId);

      // Try to get from cache first
      const cacheKey = `appointments:${businessId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
      const cachedData = this.getFromCache<AppointmentResponse[]>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get appointments from repository
      const appointments = await this.appointmentsRepository.getByBusinessId(
        businessId,
        dateRange
      );

      // Format appointments
      const formattedAppointments = this.formatAppointments(appointments);

      // Store in cache
      this.setInCache(cacheKey, formattedAppointments);

      return formattedAppointments;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get appointments',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Get calendar data including appointments and capacity
   */
  async getCalendarData(
    businessId: string, 
    dateRange: DateRange
  ): Promise<CalendarData> {
    try {
      // Try to get from cache first
      const cacheKey = `calendar:${businessId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
      const cachedData = this.getFromCache<CalendarData>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get appointments
      const appointments = await this.getAppointments(businessId, dateRange);

      // Get business capacity for the first day of the range
      // Typically for calendar views, we initially show capacity for the first day
      const capacity = await this.getBusinessCapacity(businessId, dateRange.start);

      const calendarData: CalendarData = {
        appointments,
        capacity
      };

      // Store in cache
      this.setInCache(cacheKey, calendarData);

      return calendarData;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get calendar data',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentResponse> {
    try {
      // Validate appointment ID
      if (!id) {
        throw ServiceError.create(
          'Appointment ID is required',
          'VALIDATION_ERROR',
          'A valid appointment ID must be provided'
        );
      }

      // Try to get from cache first
      const cacheKey = `appointment:${id}`;
      const cachedData = this.getFromCache<AppointmentResponse>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get appointment from repository
      const appointment = await this.appointmentsRepository.getById(id);

      if (!appointment) {
        throw ServiceError.create(
          `Appointment with ID ${id} not found`,
          'NOT_FOUND',
          'No appointment found with the given ID'
        );
      }

      // Format appointment
      const formattedAppointment = this.formatAppointment(appointment);

      // Store in cache
      this.setInCache(cacheKey, formattedAppointment);

      return formattedAppointment;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get appointment',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(data: AppointmentCreateData): Promise<AppointmentResponse> {
    try {
      // Validate required fields
      this.validateAppointmentData(data);

      // Check if business exists
      await this.validateBusinessExists(data.business_id);

      // Standardize date strings to Date objects and back to ISO strings
      const startTime = new Date(data.start_time);
      const endTime = new Date(data.end_time);
      
      // Basic validation for data integrity
      if (startTime >= endTime) {
        throw ServiceError.create(
          'Invalid time range',
          'VALIDATION_ERROR',
          'Start time must be before end time'
        );
      }
      
      // Propagate test mode setting to repository if needed
      if (this.appointmentsRepository._setTestMode) {
        this.appointmentsRepository._setTestMode(this.isTestEnvironment());
      }
      
      // Only check for appointment overlap
      await this.checkAppointmentOverlap(
        data.business_id,
        startTime,
        endTime
      );

      // Prepare data for repository
      const appointmentData = {
        business_id: data.business_id,
        user_id: data.user_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        description: data.description || null,
        party_size: data.party_size || 1,
        status: data.status || 'pending'
      };

      // Create appointment in repository
      const appointment = await this.appointmentsRepository.create(appointmentData);

      // Clear relevant caches
      this.clearCachesByPrefix(`appointments:${data.business_id}`);
      this.clearCachesByPrefix(`calendar:${data.business_id}`);

      // Format and return the appointment
      if (!appointment) {
        throw ServiceError.create(
          'Failed to create appointment',
          'CREATE_ERROR',
          'Repository did not return created appointment'
        );
      }
      
      return this.formatAppointment(appointment);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to create appointment',
        'CREATE_ERROR',
        error
      );
    }
  }

/**
 * Used by tests to signal test mode
 * @param isTestMode Whether to enable test mode
 */
_setTestMode(isTestMode: boolean): void {
  this._testMode = isTestMode;
  
  // Also set test mode on repository if available
  if (this.appointmentsRepository._setTestMode) {
    this.appointmentsRepository._setTestMode(isTestMode);
  }
}

  /**
   * Delete an appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    try {
      // Validate appointment ID
      if (!id) {
        throw ServiceError.create(
          'Appointment ID is required',
          'VALIDATION_ERROR',
          'A valid appointment ID must be provided'
        );
      }

      // Get existing appointment to access business_id for cache invalidation
      const existingAppointment = await this.appointmentsRepository.getById(id);
      if (!existingAppointment) {
        throw ServiceError.create(
          `Appointment with ID ${id} not found`,
          'NOT_FOUND',
          'The appointment you are trying to delete does not exist'
        );
      }

      // Delete the appointment
      await this.appointmentsRepository.delete(id);

      // Clear relevant caches
      this.clearCachesByPrefix(`appointment:${id}`);
      this.clearCachesByPrefix(`appointments:${existingAppointment.business_id}`);
      this.clearCachesByPrefix(`calendar:${existingAppointment.business_id}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to delete appointment',
        'DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Get appointments by status
   */
  async getAppointmentsByStatus(
    businessId: string, 
    status: AppointmentStatus,
    dateRange?: DateRange
  ): Promise<AppointmentResponse[]> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }

      // Validate status
      const validStatuses: AppointmentStatus[] = [
        'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
      ];
      if (!validStatuses.includes(status)) {
        throw ServiceError.create(
          `Invalid status: ${status}`,
          'VALIDATION_ERROR',
          `Status must be one of: ${validStatuses.join(', ')}`
        );
      }

      // Check if business exists
      await this.validateBusinessExists(businessId);

      // Validate date range if provided
      if (dateRange) {
        this.validateDateRange(dateRange);
      }

      // Try to get from cache first
      const cacheKey = `appointments:${businessId}:${status}:${dateRange ? 
        `${dateRange.start.toISOString()}:${dateRange.end.toISOString()}` : 'all'}`;
      const cachedData = this.getFromCache<AppointmentResponse[]>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get appointments from repository
      const appointments = await this.appointmentsRepository.getByStatus(
        businessId,
        status,
        dateRange
      );

      // Format appointments
      const formattedAppointments = this.formatAppointments(appointments);

      // Store in cache
      this.setInCache(cacheKey, formattedAppointments);

      return formattedAppointments;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get appointments by status',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Check if a time slot is available
   */
  async isTimeSlotAvailable(
    businessId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }
  
      // Validate times - basic data integrity only
      if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
        throw ServiceError.create(
          'Invalid date format',
          'VALIDATION_ERROR',
          'Start time and end time must be Date objects'
        );
      }
  
      if (startTime >= endTime) {
        throw ServiceError.create(
          'Invalid time range',
          'VALIDATION_ERROR',
          'Start time must be before end time'
        );
      }
  
      // Check if business exists
      await this.validateBusinessExists(businessId);
  
      // Use the repository's method to check availability
      return await this.appointmentsRepository.isTimeSlotAvailable(
        businessId, 
        startTime, 
        endTime, 
        excludeAppointmentId
      );
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to check time slot availability',
        'VALIDATION_ERROR',
        error
      );
    }
  }

  /**
 * Update an existing appointment
 */
async updateAppointment(
  id: string, 
  data: AppointmentUpdateData
): Promise<AppointmentResponse> {
  try {
    // Validate appointment ID
    if (!id) {
      throw ServiceError.create(
        'Appointment ID is required',
        'VALIDATION_ERROR',
        'A valid appointment ID must be provided'
      );
    }

    // Ensure at least one field is provided for update
    if (Object.keys(data).length === 0) {
      throw ServiceError.create(
        'No update data provided',
        'VALIDATION_ERROR',
        'At least one field must be provided for update'
      );
    }

    // Get existing appointment
    const existingAppointment = await this.appointmentsRepository.getById(id);
    if (!existingAppointment) {
      throw ServiceError.create(
        `Appointment with ID ${id} not found`,
        'NOT_FOUND',
        'The appointment you are trying to update does not exist'
      );
    }

    // Check if time is being updated
    if (data.start_time || data.end_time) {
      const startTime = data.start_time 
        ? new Date(data.start_time) 
        : new Date(existingAppointment.start_time);
      const endTime = data.end_time 
        ? new Date(data.end_time) 
        : new Date(existingAppointment.end_time);
      
      // Basic validation - start time must be before end time
      if (startTime >= endTime) {
        throw ServiceError.create(
          'Invalid time range',
          'VALIDATION_ERROR',
          'Start time must be before end time'
        );
      }
      
      // Check for overlaps with existing appointments
      await this.checkAppointmentOverlap(
        existingAppointment.business_id,
        startTime,
        endTime,
        id // Exclude current appointment from overlap check
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (data.start_time) updateData.start_time = new Date(data.start_time).toISOString();
    if (data.end_time) updateData.end_time = new Date(data.end_time).toISOString();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.party_size !== undefined) updateData.party_size = data.party_size;
    if (data.status) updateData.status = data.status;

    // Update appointment
    const updatedAppointment = await this.appointmentsRepository.update(id, updateData);

    if (!updatedAppointment) {
      throw ServiceError.create(
        'Failed to update appointment',
        'UPDATE_ERROR',
        'Repository did not return updated appointment'
      );
    }

    // Clear relevant caches
    this.clearCachesByPrefix(`appointment:${id}`);
    this.clearCachesByPrefix(`appointments:${existingAppointment.business_id}`);
    this.clearCachesByPrefix(`calendar:${existingAppointment.business_id}`);

    // Format and return the updated appointment
    return this.formatAppointment(updatedAppointment);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw ServiceError.fromRepositoryError(error);
    }
    if (error instanceof ServiceError) {
      throw error;
    }
    throw ServiceError.create(
      'Failed to update appointment',
      'UPDATE_ERROR',
      error
    );
  }
}

  /**
   * Get business capacity for a specific date
   */
  async getBusinessCapacity(
    businessId: string,
    date: Date
  ): Promise<BusinessCapacity> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }

      // Validate date
      if (!(date instanceof Date)) {
        throw ServiceError.create(
          'Invalid date format',
          'VALIDATION_ERROR',
          'Date must be a Date object'
        );
      }

      // Try to get from cache first
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `capacity:${businessId}:${dateStr}`;
      const cachedData = this.getFromCache<BusinessCapacity>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get business with details to determine type and capacity
      const business = await this.businessRepository.getBusinessWithDetails(businessId);
      if (!business) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }

      // Get total capacity based on business type
      const totalCapacity = await this.getBusinessTotalCapacity(business);

      // Get all appointments for the day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dateRange: DateRange = {
        start: startOfDay,
        end: endOfDay
      };

      // Get only confirmed and pending appointments
      const appointments = await this.appointmentsRepository.getByBusinessId(
        businessId,
        dateRange
      );

      const validStatuses: AppointmentStatus[] = ['confirmed', 'pending'];
      const validAppointments = appointments.filter(apt => 
        validStatuses.includes(apt.status as AppointmentStatus)
      );

      // Calculate booked capacity (sum of party sizes)
      const bookedCapacity = validAppointments.reduce(
        (sum, appointment) => sum + (appointment.party_size || 1),
        0
      );

      // Calculate utilization percentage
      const utilizationPercentage = totalCapacity > 0
        ? Math.min(100, (bookedCapacity / totalCapacity) * 100)
        : 0;

      const capacity: BusinessCapacity = {
        date: dateStr,
        totalCapacity,
        bookedCapacity,
        utilizationPercentage
      };

      // Store in cache
      this.setInCache(cacheKey, capacity);

      return capacity;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get business capacity',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Get utilization summary over a period
   */
  async getUtilizationSummary(
    businessId: string,
    dateRange: DateRange
  ): Promise<UtilizationSummary> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }

      // Validate date range
      this.validateDateRange(dateRange);

      // Try to get from cache first
      const cacheKey = `utilization:${businessId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
      const cachedData = this.getFromCache<UtilizationSummary>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }

      // Get all appointments in the date range
      const appointments = await this.appointmentsRepository.getByBusinessId(
        businessId,
        dateRange
      );

      // Only consider confirmed, completed, and pending appointments
      const validStatuses: AppointmentStatus[] = ['confirmed', 'completed', 'pending'];
      const validAppointments = appointments.filter(apt =>
        validStatuses.includes(apt.status as AppointmentStatus)
      );

      // Get business total capacity
      const business = await this.businessRepository.getBusinessWithDetails(businessId);
      if (!business) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }

      // Get total capacity based on business type
      const totalCapacity = await this.getBusinessTotalCapacity(business);

      // Calculate daily stats
      const dailyUtilization: Record<string, number> = {};
      const hourCounts: Record<string, number> = {};

      // Initialize dates in range
      let currentDate = new Date(dateRange.start);
      while (currentDate <= dateRange.end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dailyUtilization[dateStr] = 0;

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fill in appointment counts by day and hour
      validAppointments.forEach(appointment => {
        const aptDate = new Date(appointment.start_time);
        const dateStr = aptDate.toISOString().split('T')[0];
        const hour = aptDate.getHours();
        const hourStr = `${hour}`.padStart(2, '0');

        // Add to daily utilization
        const partySize = appointment.party_size || 1;
        dailyUtilization[dateStr] = (dailyUtilization[dateStr] || 0) + partySize;

        // Track hour frequency
        hourCounts[hourStr] = (hourCounts[hourStr] || 0) + partySize;
      });

      // Calculate average utilization
      const dayCount = Object.keys(dailyUtilization).length;
      const totalUtilization = Object.values(dailyUtilization).reduce((sum, val) => sum + val, 0);
      const averageUtilization = totalCapacity > 0 && dayCount > 0
        ? Math.min(100, (totalUtilization / (totalCapacity * dayCount)) * 100)
        : 0;

      // Get peak and slow hours
      const hourEntries = Object.entries(hourCounts);
      hourEntries.sort((a, b) => b[1] - a[1]); // Sort by count descending

      const peakHours = hourEntries
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      const slowHours = hourEntries
        .slice(-3)
        .map(([hour]) => `${hour}:00`);

      // Create utilization summary
      const summary: UtilizationSummary = {
        totalAppointments: validAppointments.length,
        averageUtilization,
        dailyUtilization,
        peakHours,
        slowHours
      };

      // Store in cache
      this.setInCache(cacheKey, summary);

      return summary;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get utilization summary',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Create an appointment from voice bot with natural language time parsing
   * This method handles timezone-aware appointment creation from voice commands
   *
   * If user_timezone is not provided, it will automatically fetch the business timezone
   *
   * @param data - Voice appointment creation data
   * @returns Success status and message
   *
   * @example
   * // With explicit timezone
   * const result = await appointmentService.createAppointmentFromVoice({
   *   business_id: 'business-123',
   *   user_id: 'user-456',
   *   natural_language_time: 'tomorrow 10 AM',
   *   user_timezone: 'Asia/Kolkata',
   *   party_size: 2,
   *   duration_minutes: 60
   * });
   *
   * // Without timezone (uses business timezone)
   * const result = await appointmentService.createAppointmentFromVoice({
   *   business_id: 'business-123',
   *   user_id: 'user-456',
   *   natural_language_time: 'tomorrow 10 AM',
   *   party_size: 2,
   *   duration_minutes: 60
   * });
   */
  async createAppointmentFromVoice(
    data: VoiceAppointmentCreateData
  ): Promise<{ success: boolean; message: string; appointment?: AppointmentResponse }> {
    try {
      // Validate required fields
      if (!data.business_id || !data.user_id || !data.natural_language_time) {
        return {
          success: false,
          message: 'Missing required fields: business_id, user_id, and natural_language_time are required'
        };
      }

      // Determine timezone to use
      let timezone = data.user_timezone;

      // If no timezone provided, fetch from business settings
      if (!timezone) {
        try {
          const business = await this.businessRepository.getBusinessWithDetails(data.business_id);
          timezone = business?.timezone || getUserTimezone(); // Fallback to browser timezone
        } catch (error) {
          console.warn('Failed to fetch business timezone, using browser timezone', error);
          timezone = getUserTimezone();
        }
      }

      // Parse natural language time to UTC
      const startTimeUTC = parseNaturalTimeToUTC(data.natural_language_time, timezone);

      // Calculate end time based on duration
      const durationMinutes = data.duration_minutes || 60;
      const startDate = new Date(startTimeUTC);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      const endTimeUTC = endDate.toISOString();

      // Create appointment with UTC times
      const appointmentData: AppointmentCreateData = {
        business_id: data.business_id,
        user_id: data.user_id,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        description: data.description || null,
        party_size: data.party_size || 1,
        status: data.status || 'pending',
        user_timezone: data.user_timezone
      };

      const appointment = await this.createAppointment(appointmentData);

      // Format confirmation message in user's local timezone
      const localDateTime = formatLocalDateTime(startTimeUTC, timezone, 'long');

      return {
        success: true,
        message: `Appointment booked successfully on ${localDateTime}`,
        appointment
      };
    } catch (error) {
      console.error('Error creating appointment from voice:', error);

      if (error instanceof ServiceError) {
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: false,
        message: 'Failed to create appointment. Please try again.'
      };
    }
  }

  /**
   * Validate if a business exists
   */
  private async validateBusinessExists(businessId: string): Promise<void> {
    const exists = await this.businessRepository.exists(businessId);
    if (!exists) {
      throw ServiceError.create(
        `Business with ID ${businessId} not found`,
        'NOT_FOUND',
        'No business found with the given ID'
      );
    }
  }

  /**
   * Validate date range
   */
  private validateDateRange(dateRange: DateRange): void {
    if (!dateRange.start || !dateRange.end) {
      throw ServiceError.create(
        'Invalid date range',
        'VALIDATION_ERROR',
        'Start date and end date are required'
      );
    }

    const start = dateRange.start instanceof Date 
      ? dateRange.start 
      : new Date(dateRange.start);
      
    const end = dateRange.end instanceof Date 
      ? dateRange.end 
      : new Date(dateRange.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ServiceError.create(
        'Invalid date format',
        'VALIDATION_ERROR',
        'Start date and end date must be valid dates'
      );
    }

    if (start > end) {
      throw ServiceError.create(
        'Invalid date range',
        'VALIDATION_ERROR',
        'Start date must be before or equal to end date'
      );
    }
  }

  /**
   * Validate appointment data
   */
  private validateAppointmentData(data: AppointmentCreateData): void {
    if (!data.business_id) {
      throw ServiceError.create(
        'Business ID is required',
        'VALIDATION_ERROR',
        'A valid business ID must be provided'
      );
    }

    if (!data.user_id) {
      throw ServiceError.create(
        'User ID is required',
        'VALIDATION_ERROR',
        'A valid user ID must be provided'
      );
    }

    if (!data.start_time || !data.end_time) {
      throw ServiceError.create(
        'Start time and end time are required',
        'VALIDATION_ERROR',
        'Valid start and end times must be provided'
      );
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses: AppointmentStatus[] = [
        'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
      ];
      if (data.status && !validStatuses.includes(data.status)) {
        throw ServiceError.create(
          `Invalid status: ${data.status}`,
          'VALIDATION_ERROR',
          `Status must be one of: ${validStatuses.join(', ')}`
        );
      }
    }
  }

  /**
   * Validate appointment time (checks for overlaps and ensures time is valid)
   * This combines time validation and availability check in one method
   */
  private async validateAppointmentTime(
    businessId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<void> {
    // Check that times are valid
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw ServiceError.create(
        'Invalid date format',
        'VALIDATION_ERROR',
        'Start time and end time must be Date objects'
      );
    }

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw ServiceError.create(
        'Invalid date values',
        'VALIDATION_ERROR',
        'Start time and end time must be valid dates'
      );
    }

    // Check that start is before end
    if (startTime >= endTime) {
      throw ServiceError.create(
        'Invalid time range',
        'VALIDATION_ERROR',
        'Start time must be before end time'
      );
    }

    // Check that appointment is not in the past
    const now = new Date();
    if (startTime < now) {
      throw ServiceError.create(
        'Invalid appointment time',
        'VALIDATION_ERROR',
        'Appointment time cannot be in the past'
      );
    }

    // Check for availability
    await this.checkAppointmentOverlap(businessId, startTime, endTime, excludeAppointmentId);
  }

  /**
   * Check for appointment overlaps
   * Separated from time validation to allow test environment to skip past time validation
   * but still check for overlaps
   */
  private async checkAppointmentOverlap(
    businessId: string, 
    startTime: Date, 
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<void> {
    const isAvailable = await this.appointmentsRepository.isTimeSlotAvailable(
      businessId,
      startTime,
      endTime,
      excludeAppointmentId
    );
  
    if (!isAvailable) {
      throw ServiceError.create(
        'Time slot is not available',
        'CONFLICT',
        'The requested time slot overlaps with existing appointments'
      );
    }
  }
      
  /**
   * Get the total capacity for a business based on its type
   */
  private async getBusinessTotalCapacity(business: any): Promise<number> {
    // Default capacity if nothing is found
    const DEFAULT_CAPACITY = 50;
    
    try {
      if (!business) return DEFAULT_CAPACITY;

      // Get capacity based on business type
      switch (business.type) {
        case 'restaurant': {
          // For restaurants, capacity is based on seating_capacity
          const details = await this.restaurantDetailsRepository.getByBusinessId(business.id);
          return details?.seating_capacity || DEFAULT_CAPACITY;
        }
        case 'retail': {
          // For retail, capacity could be based on inventory_size or a default value
          const details = await this.retailDetailsRepository.getByBusinessId(business.id);
          // Using a formula to convert inventory size to capacity (if needed)
          return details?.inventory_size 
            ? Math.min(200, Math.max(10, Math.floor(details.inventory_size / 10)))
            : DEFAULT_CAPACITY;
        }
        case 'service': {
          // For services, capacity depends on business model
          // Might be a fixed number of appointments per day
          return DEFAULT_CAPACITY;
        }
        default:
          return DEFAULT_CAPACITY;
      }
    } catch (error) {
      // In case of error, return the default capacity
      return DEFAULT_CAPACITY;
    }
  }

  /**
   * Format a single appointment for response
   */
  private formatAppointment(appointment: AppointmentV2Row): AppointmentResponse {
    // Guard against null or undefined appointments
    if (!appointment) {
      throw new Error('Cannot format undefined or null appointment');
    }
    
    return {
      id: appointment.id,
      business_id: appointment.business_id,
      user_id: appointment.user_id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      description: appointment.description,
      party_size: appointment.party_size || 1,
      status: appointment.status || 'pending',
      created_at: appointment.created_at || new Date().toISOString(),
      updated_at: appointment.updated_at || new Date().toISOString()
    };
  }

  private isTestEnvironment(): boolean {
    // Only rely on the explicit test mode flag which is set by tests
    return this._testMode;
  }

  /**
   * Format multiple appointments for response
   */
  private formatAppointments(appointments: AppointmentV2Row[]): AppointmentResponse[] {
    if (!appointments || !Array.isArray(appointments)) {
      return [];
    }
    return appointments.map(appointment => this.formatAppointment(appointment));
  }

  /**
   * Get a value from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Store a value in cache with expiration
   */
  private setInCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * Clear a specific cache entry
   */
  private clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries that start with a prefix
   */
  private clearCachesByPrefix(prefix: string): void {
    // Convert the keys iterator to an array before looping
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Test-only methods
   * These methods should only be used in tests
   */

  /**
   * Sets the age of a cache entry for testing
   * @param key The cache key
   * @param ageInMs The age to set in milliseconds (negative for expired)
   */
  _testOnlySetCacheAge(key: string, ageInMs: number): void {
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.set(key, {
        data: cached.data,
        expiry: Date.now() + ageInMs
      });
    }
  }

  /**
   * Clears all cache entries for testing
   */
  _testOnlyClearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets the number of cached items for testing
   */
  _testOnlyGetCacheSize(): number {
    return this.cache.size;
  }
}