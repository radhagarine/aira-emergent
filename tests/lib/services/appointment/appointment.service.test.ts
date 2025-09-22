// src/lib/services/appointment/appointment.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { AppointmentService } from '@/lib/services/appointment/appointment.service';
import { AppointmentStatus } from '@/lib/types/database/business.types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { 
  AppointmentCreateData, 
  AppointmentUpdateData, 
  DateRange,
  BusinessCapacity,
  UtilizationSummary
} from '@/lib/services/appointment/types';
import { RepositoryFactory } from '@/lib/database/repository.factory';

describe('AppointmentService', () => {
  // Test fixtures and helpers
  const currentDate = new Date('2025-03-14T12:00:00Z');
  const futureDate = (hoursAhead: number): Date => {
    const date = new Date(currentDate);
    date.setHours(date.getHours() + hoursAhead);
    return date;
  };
  
  const createDateRange = (): DateRange => ({
    start: new Date('2025-03-14T00:00:00Z'),
    end: new Date('2025-03-14T23:59:59Z')
  });
  
  const createMockAppointment = (id: string, businessId: string, overrides = {}): any => ({
    id,
    business_id: businessId,
    user_id: 'user-1',
    start_time: '2025-03-14T13:00:00Z',
    end_time: '2025-03-14T14:00:00Z',
    description: 'Test Meeting',
    party_size: 2,
    status: 'confirmed',
    created_at: '2025-03-13T10:00:00Z',
    updated_at: '2025-03-13T10:00:00Z',
    ...overrides
  });

  // Define types for our mocks
  interface MockRepositories {
    appointments: {
      getByBusinessId: ReturnType<typeof vi.fn>;
      getById: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      getByStatus: ReturnType<typeof vi.fn>;
      isTimeSlotAvailable: ReturnType<typeof vi.fn>;
      _setTestMode?: ReturnType<typeof vi.fn>;
    };
    business: {
      getBusinessWithDetails: ReturnType<typeof vi.fn>;
      exists: ReturnType<typeof vi.fn>;
      getBusinessById: ReturnType<typeof vi.fn>;
    };
    restaurant: { 
      getByBusinessId: ReturnType<typeof vi.fn>;
    };
    retail: { 
      getByBusinessId: ReturnType<typeof vi.fn>;
    };
    service: { 
      getByBusinessId: ReturnType<typeof vi.fn>;
    };
    factory: {
      getAppointmentsRepository: ReturnType<typeof vi.fn>;
      getBusinessRepository: ReturnType<typeof vi.fn>;
      getRestaurantDetailsRepository: ReturnType<typeof vi.fn>;
      getRetailDetailsRepository: ReturnType<typeof vi.fn>;
      getServiceDetailsRepository: ReturnType<typeof vi.fn>;
    };
  }

  let mocks: MockRepositories;
  let service: AppointmentService;

  // Set test mode for all tests in this suite
  beforeAll(() => {
    // This is a safer approach than trying to modify process.env
    if (service) {
      service._setTestMode(true);
    }
  });
  
  afterAll(() => {
    // Clean up test mode
    if (service) {
      service._setTestMode(false);
    }
  });

  beforeEach(() => {
    // Setup mocks
    vi.useFakeTimers();
    vi.setSystemTime(currentDate);

    mocks = {
      appointments: {
        getByBusinessId: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getByStatus: vi.fn(),
        isTimeSlotAvailable: vi.fn().mockResolvedValue(true),
        _setTestMode: vi.fn()
      },
      business: {
        getBusinessWithDetails: vi.fn(),
        exists: vi.fn().mockResolvedValue(true),
        getBusinessById: vi.fn()
      },
      restaurant: { getByBusinessId: vi.fn() },
      retail: { getByBusinessId: vi.fn() },
      service: { getByBusinessId: vi.fn() },
      factory: {
        getAppointmentsRepository: vi.fn(),
        getBusinessRepository: vi.fn(),
        getRestaurantDetailsRepository: vi.fn(),
        getRetailDetailsRepository: vi.fn(),
        getServiceDetailsRepository: vi.fn()
      }
    };

    // Wire up the mock repositories
    mocks.factory.getAppointmentsRepository.mockReturnValue(mocks.appointments);
    mocks.factory.getBusinessRepository.mockReturnValue(mocks.business);
    mocks.factory.getRestaurantDetailsRepository.mockReturnValue(mocks.restaurant);
    mocks.factory.getRetailDetailsRepository.mockReturnValue(mocks.retail);
    mocks.factory.getServiceDetailsRepository.mockReturnValue(mocks.service);

    // Create service instance with mock factory
    service = new AppointmentService(mocks.factory as unknown as RepositoryFactory);
    
    // Ensure test mode is enabled
    service._setTestMode(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Core Functionality', () => {
    describe('getAppointments', () => {
      it('should retrieve and format appointments within date range', async () => {
        // Setup
        const businessId = 'business-123';
        const dateRange = createDateRange();
        const mockAppointments = [
          createMockAppointment('apt-1', businessId),
          createMockAppointment('apt-2', businessId, { status: 'pending' })
        ];
        mocks.appointments.getByBusinessId.mockResolvedValue(mockAppointments);

        // Execute
        const result = await service.getAppointments(businessId, dateRange);

        // Verify
        expect(result).toHaveLength(2);
        expect(mocks.appointments.getByBusinessId).toHaveBeenCalledWith(businessId, dateRange);
        expect(result[0].id).toBe('apt-1');
        expect(result[1].id).toBe('apt-2');
      });

      it('should validate inputs and handle errors', async () => {
        // Empty business ID
        await expect(service.getAppointments('', createDateRange()))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Invalid date range
        const invalidRange = {
          start: new Date('2025-03-15T00:00:00Z'),
          end: new Date('2025-03-14T23:59:59Z')
        };
        await expect(service.getAppointments('business-123', invalidRange))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Repository error
        mocks.appointments.getByBusinessId.mockRejectedValue(new Error('DB error'));
        await expect(service.getAppointments('business-123', createDateRange()))
          .rejects.toBeInstanceOf(ServiceError);
      });
    });

    describe('getAppointmentById', () => {
      it('should retrieve a single appointment by ID', async () => {
        // Setup
        const appointmentId = 'apt-123';
        const mockAppointment = createMockAppointment(appointmentId, 'business-123');
        mocks.appointments.getById.mockResolvedValue(mockAppointment);

        // Execute
        const result = await service.getAppointmentById(appointmentId);

        // Verify
        expect(result).toEqual(expect.objectContaining({
          id: appointmentId,
          business_id: 'business-123'
        }));
        expect(mocks.appointments.getById).toHaveBeenCalledWith(appointmentId);
      });

      it('should throw error if appointment not found', async () => {
        mocks.appointments.getById.mockResolvedValue(null);
        await expect(service.getAppointmentById('non-existent'))
          .rejects.toBeInstanceOf(ServiceError);
      });
    });

    describe('createAppointment', () => {
      it('should create a valid appointment', async () => {
        // Setup
        const businessId = 'business-123';
        const appointmentData: AppointmentCreateData = {
          business_id: businessId,
          user_id: 'user-1',
          start_time: futureDate(1),
          end_time: futureDate(2),
          description: 'New Meeting',
          party_size: 3
        };

        const createdAppointment = createMockAppointment('new-apt', businessId, {
          user_id: 'user-1',
          start_time: futureDate(1).toISOString(),
          end_time: futureDate(2).toISOString(),
          description: 'New Meeting',
          party_size: 3,
          status: 'pending'
        });

        mocks.appointments.create.mockResolvedValue(createdAppointment);

        // Execute
        const result = await service.createAppointment(appointmentData);

        // Verify
        expect(result).toEqual(expect.objectContaining({
          id: 'new-apt',
          business_id: businessId,
          description: 'New Meeting'
        }));
        expect(mocks.business.exists).toHaveBeenCalledWith(businessId);
        expect(mocks.appointments.create).toHaveBeenCalled();
      });

      it('should validate inputs and handle errors', async () => {
        // Missing required fields
        await expect(service.createAppointment({ user_id: 'user-1' } as AppointmentCreateData))
          .rejects.toBeInstanceOf(ServiceError);
          
        // Invalid time range
        await expect(service.createAppointment({
          business_id: 'business-123',
          user_id: 'user-1',
          start_time: futureDate(2),
          end_time: futureDate(1)
        })).rejects.toBeInstanceOf(ServiceError);
        
        // Non-existent business
        mocks.business.exists.mockResolvedValue(false);
        await expect(service.createAppointment({
          business_id: 'non-existent',
          user_id: 'user-1',
          start_time: futureDate(1),
          end_time: futureDate(2)
        })).rejects.toBeInstanceOf(ServiceError);
        
        // Verify no appointments were created
        expect(mocks.appointments.create).not.toHaveBeenCalled();
      });

      it('should allow appointments with past dates (since validation is handled by agent)', async () => {
        // Past appointment times - should be allowed since validation is handled by agent
        const pastDate = new Date(currentDate);
        pastDate.setHours(pastDate.getHours() - 1);
        
        const businessId = 'business-123';
        const appointmentData: AppointmentCreateData = {
          business_id: businessId,
          user_id: 'user-1',
          start_time: pastDate,
          end_time: futureDate(1),
          description: 'Test past appointment'
        };

        const createdAppointment = createMockAppointment('past-apt', businessId, {
          user_id: 'user-1',
          start_time: pastDate.toISOString(),
          end_time: futureDate(1).toISOString(),
          description: 'Test past appointment',
          status: 'pending'
        });

        mocks.business.exists.mockResolvedValue(true);
        mocks.appointments.create.mockResolvedValue(createdAppointment);
        
        // Execute - should work since past date validation is handled by agent
        const result = await service.createAppointment(appointmentData);
        
        // Verify
        expect(result).toEqual(expect.objectContaining({
          id: 'past-apt',
          business_id: businessId
        }));
        expect(mocks.appointments.create).toHaveBeenCalled();
      });
    });

    describe('updateAppointment', () => {
      it('should update an existing appointment', async () => {
        // Setup
        const appointmentId = 'apt-123';
        const businessId = 'business-123';
        const existingAppointment = createMockAppointment(appointmentId, businessId, { status: 'pending' });
        const updateData: AppointmentUpdateData = {
          description: 'Updated Meeting',
          party_size: 3,
          status: 'confirmed' as AppointmentStatus
        };
        const updatedAppointment = {
          ...existingAppointment,
          ...updateData,
          updated_at: new Date().toISOString()
        };

        mocks.appointments.getById.mockResolvedValue(existingAppointment);
        mocks.appointments.update.mockResolvedValue(updatedAppointment);

        // Execute
        const result = await service.updateAppointment(appointmentId, updateData);

        // Verify
        expect(result).toEqual(expect.objectContaining({
          id: appointmentId,
          description: 'Updated Meeting',
          party_size: 3,
          status: 'confirmed'
        }));
        expect(mocks.appointments.getById).toHaveBeenCalledWith(appointmentId);
        expect(mocks.appointments.update).toHaveBeenCalledWith(appointmentId, expect.anything());
      });

      it('should validate time changes and check availability', async () => {
        // Setup
        const appointmentId = 'apt-123';
        const businessId = 'business-123';
        const existingAppointment = createMockAppointment(appointmentId, businessId);
        const updateData: AppointmentUpdateData = {
          start_time: futureDate(1),
          end_time: futureDate(2)
        };

        mocks.appointments.getById.mockResolvedValue(existingAppointment);
        mocks.appointments.update.mockResolvedValue({
          ...existingAppointment,
          ...updateData,
          start_time: futureDate(1).toISOString(),
          end_time: futureDate(2).toISOString()
        });
        
        // Execute
        await service.updateAppointment(appointmentId, updateData);
        
        // Verify the overlap check was called with correct parameters including appointment ID
        expect(mocks.appointments.isTimeSlotAvailable).toHaveBeenCalledWith(
          businessId, 
          expect.any(Date), 
          expect.any(Date), 
          appointmentId
        );
        
        // Test rejection when repository update fails
        mocks.appointments.update.mockRejectedValue(new Error('Update failed'));
        await expect(service.updateAppointment(appointmentId, updateData))
          .rejects.toBeInstanceOf(ServiceError);
      });

      it('should handle when no update data is provided', async () => {
        // Setup
        const appointmentId = 'apt-123';
        
        // Execute with empty update data
        await expect(service.updateAppointment(appointmentId, {}))
          .rejects.toBeInstanceOf(ServiceError);
      });
    });

    describe('deleteAppointment', () => {
      it('should delete an existing appointment', async () => {
        // Setup
        const appointmentId = 'apt-123';
        const existingAppointment = createMockAppointment(appointmentId, 'business-123');
        mocks.appointments.getById.mockResolvedValue(existingAppointment);

        // Execute
        await service.deleteAppointment(appointmentId);

        // Verify
        expect(mocks.appointments.getById).toHaveBeenCalledWith(appointmentId);
        expect(mocks.appointments.delete).toHaveBeenCalledWith(appointmentId);
      });

      it('should validate and handle errors', async () => {
        // Empty ID
        await expect(service.deleteAppointment(''))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Non-existent appointment
        mocks.appointments.getById.mockResolvedValue(null);
        await expect(service.deleteAppointment('non-existent'))
          .rejects.toBeInstanceOf(ServiceError);
          
        // Verify no deletions were performed
        expect(mocks.appointments.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Additional Service Methods', () => {
    describe('getAppointmentsByStatus', () => {
      it('should retrieve appointments with specified status', async () => {
        // Setup
        const businessId = 'business-123';
        const status: AppointmentStatus = 'confirmed';
        const dateRange = createDateRange();
        const mockAppointments = [
          createMockAppointment('apt-1', businessId, { status }),
          createMockAppointment('apt-2', businessId, { status })
        ];
        
        mocks.appointments.getByStatus.mockResolvedValue(mockAppointments);
        
        // Execute
        const result = await service.getAppointmentsByStatus(businessId, status, dateRange);
        
        // Verify
        expect(result).toHaveLength(2);
        expect(mocks.appointments.getByStatus).toHaveBeenCalledWith(
          businessId, 
          status,
          dateRange
        );
        expect(result[0].status).toBe(status);
        expect(result[1].status).toBe(status);
      });
      
      it('should validate inputs and handle errors', async () => {
        // Empty business ID
        await expect(service.getAppointmentsByStatus('', 'confirmed'))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Invalid status
        await expect(service.getAppointmentsByStatus('business-123', 'invalid-status' as AppointmentStatus))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Repository error
        mocks.appointments.getByStatus.mockRejectedValue(new Error('DB error'));
        await expect(service.getAppointmentsByStatus('business-123', 'confirmed'))
          .rejects.toBeInstanceOf(ServiceError);
      });
    });

    describe('isTimeSlotAvailable', () => {
      it('should check if a time slot is available', async () => {
        // Setup
        const businessId = 'business-123';
        const startTime = futureDate(1);
        const endTime = futureDate(2);
        
        // Test when slot is available
        mocks.appointments.isTimeSlotAvailable.mockResolvedValue(true);
        const result1 = await service.isTimeSlotAvailable(businessId, startTime, endTime);
        expect(result1).toBe(true);
        
        // Test when slot is not available
        mocks.appointments.isTimeSlotAvailable.mockResolvedValue(false);
        const result2 = await service.isTimeSlotAvailable(businessId, startTime, endTime);
        expect(result2).toBe(false);
        
        // Verify repository calls
        expect(mocks.appointments.isTimeSlotAvailable).toHaveBeenCalledWith(
          businessId,
          startTime,
          endTime,
          undefined
        );
      });
      
      it('should validate inputs and handle errors', async () => {
        // Empty business ID
        await expect(service.isTimeSlotAvailable('', futureDate(1), futureDate(2)))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Invalid time range (end before start)
        await expect(service.isTimeSlotAvailable('business-123', futureDate(2), futureDate(1)))
          .rejects.toBeInstanceOf(ServiceError);
        
        // Repository error
        mocks.appointments.isTimeSlotAvailable.mockRejectedValue(new Error('DB error'));
        await expect(service.isTimeSlotAvailable('business-123', futureDate(1), futureDate(2)))
          .rejects.toBeInstanceOf(ServiceError);
      });
    });
  });

  describe('Calendar and Capacity Functions', () => {
    it('should get calendar data with appointments and capacity', async () => {
      // Setup spies
      const getAppointmentsSpy = vi.spyOn(service, 'getAppointments');
      const getCapacitySpy = vi.spyOn(service, 'getBusinessCapacity');
      
      // Mock return values
      getAppointmentsSpy.mockResolvedValue([createMockAppointment('apt-1', 'business-123')]);
      getCapacitySpy.mockResolvedValue({
        date: '2025-03-14',
        totalCapacity: 50,
        bookedCapacity: 2,
        utilizationPercentage: 4
      } as BusinessCapacity);
      
      // Execute
      const businessId = 'business-123';
      const dateRange = createDateRange();
      const result = await service.getCalendarData(businessId, dateRange);
      
      // Verify
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('capacity');
      expect(getAppointmentsSpy).toHaveBeenCalledWith(businessId, dateRange);
      expect(getCapacitySpy).toHaveBeenCalledWith(businessId, dateRange.start);
    });

    it('should calculate business capacity', async () => {
      // Setup
      const businessId = 'business-123';
      const date = new Date('2025-03-14');
      const mockBusiness = {
        id: businessId,
        name: 'Test Business',
        type: 'restaurant'
      };
      const mockDetails = { seating_capacity: 50 };
      const mockAppointments = [
        createMockAppointment('apt-1', businessId, { party_size: 2 }),
        createMockAppointment('apt-2', businessId, { party_size: 3, status: 'pending' })
      ];

      mocks.business.getBusinessWithDetails.mockResolvedValue(mockBusiness);
      mocks.restaurant.getByBusinessId.mockResolvedValue(mockDetails);
      mocks.appointments.getByBusinessId.mockResolvedValue(mockAppointments);
      
      // Execute
      const result = await service.getBusinessCapacity(businessId, date);
      
      // Verify
      expect(result).toEqual({
        date: '2025-03-14',
        totalCapacity: 50,
        bookedCapacity: 5, // 2 + 3
        utilizationPercentage: 10 // (5/50) * 100
      });
    });

    it('should get utilization summary', async () => {
      // Setup
      const businessId = 'business-123';
      const dateRange = createDateRange();
      const mockBusiness = {
        id: businessId,
        name: 'Test Business',
        type: 'restaurant',
        user_id: 'user-1'
      };
      const mockDetails = { seating_capacity: 50 };
      
      // Create appointments at different hours
      const mockAppointments = [
        createMockAppointment('apt-1', businessId, { 
          start_time: '2025-03-14T09:00:00Z',
          party_size: 2,
          status: 'confirmed'
        }),
        createMockAppointment('apt-2', businessId, { 
          start_time: '2025-03-14T09:30:00Z',
          party_size: 3,
          status: 'pending'
        }),
        createMockAppointment('apt-3', businessId, { 
          start_time: '2025-03-14T13:00:00Z',
          party_size: 4,
          status: 'completed'
        }),
        createMockAppointment('apt-4', businessId, { 
          start_time: '2025-03-14T15:00:00Z',
          party_size: 2,
          status: 'cancelled'
        })
      ];

      mocks.business.getBusinessWithDetails.mockResolvedValue(mockBusiness);
      mocks.restaurant.getByBusinessId.mockResolvedValue(mockDetails);
      mocks.appointments.getByBusinessId.mockResolvedValue(mockAppointments);
      
      // Execute
      const result = await service.getUtilizationSummary(businessId, dateRange);
      
      // Verify
      expect(result).toHaveProperty('totalAppointments');
      expect(result).toHaveProperty('averageUtilization');
      expect(result).toHaveProperty('dailyUtilization');
      expect(result).toHaveProperty('peakHours');
      expect(result).toHaveProperty('slowHours');
      
      // Should only count confirmed, completed, and pending appointments (not cancelled)
      expect(Object.values(result.dailyUtilization)[0]).toBeGreaterThan(0);
      
      // Peak hours should include at least one entry
      expect(result.peakHours.length).toBeGreaterThan(0);
    });
  });

  describe('Caching Behavior', () => {
    // Make sure all cache-related tests start with a fresh cache
    beforeEach(() => {
      service._testOnlyClearCache();
    });
    
    it('should use cache and invalidate it appropriately', async () => {
      // Setup
      const businessId = 'business-123';
      const dateRange = createDateRange();
      mocks.appointments.getByBusinessId.mockResolvedValue([]);
      
      // First call should hit repository
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
      
      // Simulate clearing cache
      const clearCachesSpy = vi.spyOn(service as any, 'clearCachesByPrefix');
      
      // Create mock appointment for successful creation
      const mockCreatedAppt = createMockAppointment('new-apt', businessId);
      mocks.appointments.create.mockResolvedValue(mockCreatedAppt);
      
      // Create appointment should clear cache
      await service.createAppointment({
        business_id: businessId,
        user_id: 'user-1',
        start_time: futureDate(1),
        end_time: futureDate(2)
      });
      
      expect(clearCachesSpy).toHaveBeenCalledWith(`appointments:${businessId}`);
      clearCachesSpy.mockClear();
      
      // Setup for update test
      const appointmentId = 'apt-123';
      mocks.appointments.getById.mockResolvedValue(createMockAppointment(appointmentId, businessId));
      
      // Mock successful update
      mocks.appointments.update.mockResolvedValue({
        ...createMockAppointment(appointmentId, businessId),
        description: 'Updated'
      });
      
      // Update appointment should clear caches
      await service.updateAppointment(appointmentId, { description: 'Updated' });
      
      expect(clearCachesSpy).toHaveBeenCalledWith(`appointment:${appointmentId}`);
      expect(clearCachesSpy).toHaveBeenCalledWith(`appointments:${businessId}`);
      expect(clearCachesSpy).toHaveBeenCalledWith(`calendar:${businessId}`);
    });

    it('should expire cache entries after TTL', async () => {
      // Setup
      const businessId = 'business-123';
      const dateRange = createDateRange();
      mocks.appointments.getByBusinessId.mockResolvedValue([]);
      
      // First call hits repository
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
      
      // Immediate second call uses cache
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
      
      // Clear call count to ensure we're only counting new calls
      mocks.appointments.getByBusinessId.mockClear();
      
      // Manually expire the cache using helper
      const cacheKey = `appointments:${businessId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
      service._testOnlySetCacheAge(cacheKey, -1); // Set to expired
      
      // Call after expiration should hit repository again
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
    });
    
    it('should work with test helper methods', async () => {
      // Setup
      const businessId = 'business-123';
      const dateRange = createDateRange();
      mocks.appointments.getByBusinessId.mockResolvedValue([]);
      
      // First call should hit repository
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(1);
      
      // Check that cache size is now 1
      expect(service._testOnlyGetCacheSize()).toBe(1);
      
      // Clear the cache
      service._testOnlyClearCache();
      
      // Check that cache is now empty
      expect(service._testOnlyGetCacheSize()).toBe(0);
      
      // Next call should hit repository again
      await service.getAppointments(businessId, dateRange);
      expect(mocks.appointments.getByBusinessId).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases and Private Methods', () => {
    it('should handle edge cases and errors gracefully', async () => {
      // Business not found
      mocks.business.getBusinessWithDetails.mockResolvedValue(null);
      await expect(service.getBusinessCapacity('non-existent', new Date()))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Timezone handling test with fixed timezone format
      const appointmentData: AppointmentCreateData = {
        business_id: 'business-123',
        user_id: 'user-1',
        // Use ISO format strings without timezone to ensure consistent behavior
        start_time: new Date('2025-03-14T13:00:00Z'), 
        end_time: new Date('2025-03-14T15:00:00Z')
      };
      
      // Create a mock for successful appointment creation
      mocks.appointments.create.mockImplementation(data => ({
        id: 'new-apt',
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Create the appointment - should work
      const result = await service.createAppointment(appointmentData);
      
      // Verify result and repository call
      expect(result).toHaveProperty('id', 'new-apt');
      expect(mocks.appointments.create).toHaveBeenCalled();
    });

    it('should properly format appointments', async () => {
      // Test the private formatAppointment method
      const appointment = createMockAppointment('apt-123', 'business-123', {
        party_size: null,
        status: null
      });
      
      // We need to directly access the private method for testing
      const formattedAppointment = (service as any).formatAppointment(appointment);
      
      // Verify defaults are applied
      expect(formattedAppointment.party_size).toBe(1); // Default party size
      expect(formattedAppointment.status).toBe('pending'); // Default status
    });
  });

  describe('Test Mode and Helper Methods', () => {
    it('should still have test mode for testing purposes', async () => {
      // Test setting test mode
      service._setTestMode(true);
      expect((service as any)._testMode).toBe(true);
      
      service._setTestMode(false);
      expect((service as any)._testMode).toBe(false);
      
      // Reset to test mode for other tests
      service._setTestMode(true);
    });
    
    it('should handle different business types for capacity calculation', async () => {
      const businessId = 'business-123';
      const date = new Date('2025-03-14');
      
      // Test restaurant type
      mocks.business.getBusinessWithDetails.mockResolvedValue({
        id: businessId,
        type: 'restaurant',
        name: 'Test Restaurant'
      });
      mocks.restaurant.getByBusinessId.mockResolvedValue({ seating_capacity: 100 });
      mocks.appointments.getByBusinessId.mockResolvedValue([]);
      
      let result = await service.getBusinessCapacity(businessId, date);
      expect(result.totalCapacity).toBe(100);
      
      // Test retail type
      mocks.business.getBusinessWithDetails.mockResolvedValue({
        id: businessId,
        type: 'retail',
        name: 'Test Retail Store'
      });
      mocks.retail.getByBusinessId.mockResolvedValue({ inventory_size: 500 });
      
      result = await service.getBusinessCapacity(businessId, date);
      expect(result.totalCapacity).toBeGreaterThan(0);
      
      // Test service type
      mocks.business.getBusinessWithDetails.mockResolvedValue({
        id: businessId,
        type: 'service',
        name: 'Test Service Business'
      });
      
      result = await service.getBusinessCapacity(businessId, date);
      expect(result.totalCapacity).toBeGreaterThan(0);
      
      // Test with null details
      mocks.business.getBusinessWithDetails.mockResolvedValue({
        id: businessId,
        type: 'restaurant',
        name: 'Test Restaurant'
      });
      mocks.restaurant.getByBusinessId.mockResolvedValue(null);
      
      result = await service.getBusinessCapacity(businessId, date);
      expect(result.totalCapacity).toBeGreaterThan(0); // Should use default capacity
    });
    
    it('should create appointments with past dates since validation is handled by agent', async () => {
      // Setup
      const businessId = 'business-123';
      const pastStart = new Date(currentDate);
      pastStart.setHours(pastStart.getHours() - 2);
      
      const pastEnd = new Date(currentDate);
      pastEnd.setHours(pastEnd.getHours() - 1);
      
      // Create appointment data with past times
      const appointmentData: AppointmentCreateData = {
        business_id: businessId,
        user_id: 'user-1',
        start_time: pastStart,
        end_time: pastEnd,
        description: 'Past meeting'
      };
      
      // Create a mock for successful appointment creation
      mocks.appointments.create.mockImplementation(data => ({
        id: 'new-apt',
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      mocks.business.exists.mockResolvedValue(true);
      
      // Should succeed since past date validation is handled by agent
      const result = await service.createAppointment(appointmentData);
      
      // Verify result and repository call
      expect(result).toHaveProperty('id', 'new-apt');
      expect(mocks.appointments.create).toHaveBeenCalled();
    });
  });
});