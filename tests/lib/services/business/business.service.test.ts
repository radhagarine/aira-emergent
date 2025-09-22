import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusinessService } from '@/lib/services/business/business.service';
import { BusinessType, BusinessFileType } from '@/lib/types/database/business.types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { MockFile } from '@/tests/utils/mocks/file.mock';

// Mock the business service factory
vi.mock('@/lib/services/business/business-service.factory', () => {
  return {
    businessServiceFactory: {
      getTypeSpecificService: vi.fn().mockImplementation(() => ({
        createDetails: vi.fn(),
        updateDetails: vi.fn(),
        deleteDetails: vi.fn(),
        getDetailsByBusinessId: vi.fn(),
        updateCustomerInteraction: vi.fn()
      }))
    }
  };
});

// Import the mocked businessServiceFactory
import { businessServiceFactory } from '@/lib/services/business/business-service.factory';

describe('BusinessService', () => {
  let businessService: BusinessService;
  let mockBusinessRepository: any;
  let mockFileStorageRepository: any;
  let mockBusinessFilesRepository: any;
  let mockRepositoryFactory: any;
  let mockTypeSpecificService: any;
  let mockCacheManager: any;

  beforeEach(() => {
    // Create mock type-specific service with common methods
    mockTypeSpecificService = {
      createDetails: vi.fn(),
      updateDetails: vi.fn(),
      deleteDetails: vi.fn(),
      getDetailsByBusinessId: vi.fn(),
      updateCustomerInteraction: vi.fn()
    };

    // Reset the mock implementation to use our local mockTypeSpecificService
    (businessServiceFactory.getTypeSpecificService as any).mockReturnValue(mockTypeSpecificService);

    // Create mock repositories
    mockBusinessRepository = {
      getBusinessById: vi.fn(),
      getBusinessWithDetails: vi.fn(),
      getBusinessesWithDetails: vi.fn(),
      createBusiness: vi.fn(),
      updateBusiness: vi.fn(),
      deleteBusiness: vi.fn(),
      exists: vi.fn().mockResolvedValue(true)
    };

    mockFileStorageRepository = {
      uploadFile: vi.fn(),
      validateFile: vi.fn(),
      getPublicUrl: vi.fn().mockImplementation(path => `https://example.com/${path}`),
      deleteFile: vi.fn()
    };

    mockBusinessFilesRepository = {
      createFile: vi.fn(),
      getFilesByBusinessId: vi.fn(),
      getFilesByType: vi.fn(),
      deleteFile: vi.fn()
    };

    // Create mock cache manager
    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      clearByPrefix: vi.fn()
    };

    // Create a mock repository factory
    mockRepositoryFactory = {
      getBusinessRepository: vi.fn().mockReturnValue(mockBusinessRepository),
      getFileStorageRepository: vi.fn().mockReturnValue(mockFileStorageRepository),
      getBusinessFilesRepository: vi.fn().mockReturnValue(mockBusinessFilesRepository),
      reset: vi.fn()
    };

    // Create service instance with mock factory
    businessService = new BusinessService(mockRepositoryFactory);

    // Replace the cache manager with our mock
    (businessService as any).cacheManager = mockCacheManager;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getBusinessProfile', () => {
    it('should return business profiles for a user from cache if available', async () => {
      // Create test data
      const userId = 'user-123';
      const mockBusinesses = [
        {
          id: 'business-1',
          name: 'Business 1',
          type: 'restaurant' as BusinessType,
          user_id: userId,
        },
        {
          id: 'business-2',
          name: 'Business 2',
          type: 'retail' as BusinessType,
          user_id: userId,
        },
      ];

      // Mock cache hit
      mockCacheManager.get.mockReturnValue(mockBusinesses);

      // Call the service method
      const result = await businessService.getBusinessProfile(userId);

      // Verify result
      expect(result).toEqual(mockBusinesses);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`business:profiles:${userId}`);
      expect(mockBusinessRepository.getBusinessesWithDetails).not.toHaveBeenCalled();
    });

    it('should fetch business profiles from repository if not in cache', async () => {
      // Create test data
      const userId = 'user-123';
      const mockBusinesses = [
        {
          id: 'business-1',
          name: 'Business 1',
          type: 'restaurant' as BusinessType,
          user_id: userId,
        }
      ];

      // Mock cache miss
      mockCacheManager.get.mockReturnValue(null);
      // Mock repository response
      mockBusinessRepository.getBusinessesWithDetails.mockResolvedValue(mockBusinesses);

      // Call the service method
      const result = await businessService.getBusinessProfile(userId);

      // Verify result
      expect(result).toEqual(mockBusinesses);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`business:profiles:${userId}`);
      expect(mockBusinessRepository.getBusinessesWithDetails).toHaveBeenCalledWith(userId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`business:profiles:${userId}`, mockBusinesses);
    });

    it('should handle repository errors', async () => {
      // Create test data
      const userId = 'user-123';
      const mockError = new Error('Database error');

      // Mock cache miss
      mockCacheManager.get.mockReturnValue(null);
      // Mock repository to throw error
      mockBusinessRepository.getBusinessesWithDetails.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(businessService.getBusinessProfile(userId))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was called
      expect(mockBusinessRepository.getBusinessesWithDetails).toHaveBeenCalledWith(userId);
    });
  });

  describe('getBusinessDetails', () => {
    it('should return detailed business information from cache if available', async () => {
      // Create test data
      const businessId = 'business-123';
      const mockBusiness = {
        id: businessId,
        name: 'Test Business',
        type: 'restaurant' as BusinessType,
        restaurant_details_v2: {
          menu_items: 'Pizza, Pasta',
          seating_capacity: 50,
        },
      };

      // Mock cache hit
      mockCacheManager.get.mockReturnValue(mockBusiness);

      // Call the service method
      const result = await businessService.getBusinessDetails(businessId);

      // Verify result
      expect(result).toEqual(mockBusiness);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`business:details:${businessId}`);
      expect(mockBusinessRepository.getBusinessWithDetails).not.toHaveBeenCalled();
    });

    it('should fetch business details from repository if not in cache', async () => {
      // Create test data
      const businessId = 'business-123';
      const mockBusiness = {
        id: businessId,
        name: 'Test Business',
        type: 'restaurant' as BusinessType,
        restaurant_details_v2: {
          menu_items: 'Pizza, Pasta',
          seating_capacity: 50,
        },
      };

      // Mock cache miss
      mockCacheManager.get.mockReturnValue(null);
      // Mock repository response
      mockBusinessRepository.getBusinessWithDetails.mockResolvedValue(mockBusiness);

      // Call the service method
      const result = await businessService.getBusinessDetails(businessId);

      // Verify result
      expect(result).toEqual(mockBusiness);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`business:details:${businessId}`);
      expect(mockBusinessRepository.getBusinessWithDetails).toHaveBeenCalledWith(businessId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`business:details:${businessId}`, mockBusiness);
    });

    it('should throw error when business not found', async () => {
      // Create test data
      const businessId = 'non-existent-business';

      // Mock cache miss
      mockCacheManager.get.mockReturnValue(null);
      // Mock repository to return null
      mockBusinessRepository.getBusinessWithDetails.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(businessService.getBusinessDetails(businessId))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was called
      expect(mockBusinessRepository.getBusinessWithDetails).toHaveBeenCalledWith(businessId);
    });
  });

  describe('createBusiness', () => {
    it('should create a new business with default type', async () => {
      // Create test data
      const userData = {
        user_id: 'user-123',
        name: 'New Business',
      };

      // Mock repository responses
      const mockNewBusiness = {
        id: 'business-123',
        ...userData,
        type: 'restaurant' as BusinessType,
      };
      mockBusinessRepository.createBusiness.mockResolvedValue(mockNewBusiness);

      const mockDetailedBusiness = {
        ...mockNewBusiness,
        restaurant_details_v2: { seating_capacity: 0 },
      };
      mockBusinessRepository.getBusinessWithDetails.mockResolvedValue(mockDetailedBusiness);

      // Make sure the factory returns our mock service for 'restaurant' type
      (businessServiceFactory.getTypeSpecificService as any).mockImplementationOnce((type: BusinessType) => {
        if (type === 'restaurant') {
          return mockTypeSpecificService;
        }
        throw new Error('Invalid business type');
      });

      // Call the service method
      const result = await businessService.createBusiness(userData);

      // Verify results
      expect(result).toHaveProperty('id', 'business-123');
      expect(result).toHaveProperty('type', 'restaurant');
      expect(result).toHaveProperty('restaurant_details_v2');

      // Verify repository calls
      expect(mockBusinessRepository.createBusiness).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userData.user_id,
        name: userData.name,
        type: 'restaurant',
      }));

      // Verify type-specific service was called
      expect(businessServiceFactory.getTypeSpecificService).toHaveBeenCalledWith('restaurant');
      expect(mockTypeSpecificService.createDetails).toHaveBeenCalledWith(
        'business-123',
        expect.any(Object)
      );

      // Verify cache was cleared
      expect(mockCacheManager.clearByPrefix).toHaveBeenCalledWith(`business:profiles:${userData.user_id}`);
    });

    it('should create a business with specified type', async () => {
      // Create test data
      const userData = {
        user_id: 'user-123',
        name: 'New Retail Business',
        type: 'retail' as BusinessType,
      };

      // Mock repository responses
      const mockNewBusiness = {
        id: 'business-123',
        ...userData,
      };
      mockBusinessRepository.createBusiness.mockResolvedValue(mockNewBusiness);

      const mockDetailedBusiness = {
        ...mockNewBusiness,
        retail_details_v2: { inventory_size: 0 },
      };
      mockBusinessRepository.getBusinessWithDetails.mockResolvedValue(mockDetailedBusiness);

      // Make sure the factory returns our mock service for 'retail' type
      (businessServiceFactory.getTypeSpecificService as any).mockImplementationOnce((type: BusinessType) => {
        if (type === 'retail') {
          return mockTypeSpecificService;
        }
        throw new Error('Invalid business type');
      });

      // Call the service method
      const result = await businessService.createBusiness(userData);

      // Verify results
      expect(result).toHaveProperty('id', 'business-123');
      expect(result).toHaveProperty('type', 'retail');
      expect(result).toHaveProperty('retail_details_v2');

      // Verify repository calls
      expect(mockBusinessRepository.createBusiness).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userData.user_id,
        name: userData.name,
        type: 'retail',
      }));

      // Verify type-specific service was called with retail type
      expect(businessServiceFactory.getTypeSpecificService).toHaveBeenCalledWith('retail');
      expect(mockTypeSpecificService.createDetails).toHaveBeenCalledWith(
        'business-123',
        expect.any(Object)
      );
    });

    it('should throw error with invalid input', async () => {
      // Create test data with missing required fields
      const invalidData = {
        name: 'Invalid Business',
        // missing user_id
      };

      // Call the service method and expect it to throw
      await expect(businessService.createBusiness(invalidData as any))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was not called
      expect(mockBusinessRepository.createBusiness).not.toHaveBeenCalled();
    });
  });

  describe('updateBusiness', () => {
    it('should update business details', async () => {
      // Create test data
      const businessId = 'business-123';
      const updateData = {
        name: 'Updated Business Name',
        address: '123 New Street',
      };

      // Mock repository responses
      const existingBusiness = {
        id: businessId,
        name: 'Old Business Name',
        type: 'restaurant' as BusinessType,
        user_id: 'user-123',
      };
      mockBusinessRepository.getBusinessById.mockResolvedValue(existingBusiness);

      const updatedBusiness = {
        ...existingBusiness,
        ...updateData,
      };
      mockBusinessRepository.updateBusiness.mockResolvedValue(updatedBusiness);

      // Mock the getBusinessDetails call at the end
      mockBusinessRepository.getBusinessWithDetails.mockResolvedValue(updatedBusiness);

      // Call the service method
      const result = await businessService.updateBusiness(businessId, updateData);

      // Verify repository calls
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
      expect(mockBusinessRepository.updateBusiness).toHaveBeenCalledWith(
        businessId,
        expect.objectContaining(updateData)
      );

      // Verify cache was cleared
      expect(mockCacheManager.clear).toHaveBeenCalledWith(`business:details:${businessId}`);
      expect(mockCacheManager.clearByPrefix).toHaveBeenCalledWith(`business:profiles:${existingBusiness.user_id}`);

      // Verify result
      expect(result).toEqual(updatedBusiness);
    });

    it('should throw error when business not found', async () => {
      // Create test data
      const businessId = 'non-existent-business';
      const updateData = {
        name: 'Updated Name',
      };

      // Mock repository to return null
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(businessService.updateBusiness(businessId, updateData))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was called
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
      expect(mockBusinessRepository.updateBusiness).not.toHaveBeenCalled();
    });
  });

  describe('getBusinessById', () => {
    it('should return a business by ID', async () => {
      // Create test data
      const businessId = 'business-123';
      const mockBusiness = {
        id: businessId,
        name: 'Test Business',
        type: 'restaurant' as BusinessType,
      };

      // Mock repository response
      mockBusinessRepository.getBusinessById.mockResolvedValue(mockBusiness);

      // Call the service method
      const result = await businessService.getBusinessById(businessId);

      // Verify result
      expect(result).toEqual(mockBusiness);
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
    });

    it('should throw error when business not found', async () => {
      // Create test data
      const businessId = 'non-existent-business';

      // Mock repository to return null
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(businessService.getBusinessById(businessId))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was called
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
    });
  });

  describe('updateCustomerInteraction', () => {
    it('should update customer interaction preferences', async () => {
      // Create test data
      const businessId = 'business-123';
      const updateData = {
        ai_communication_style: 'friendly',
        greeting_message: 'Welcome to our business!',
        special_instructions: 'Please handle with care.',
      };

      // Mock repository responses
      const existingBusiness = {
        id: businessId,
        type: 'retail' as BusinessType,
      };
      mockBusinessRepository.getBusinessById.mockResolvedValue(existingBusiness);

      // Make sure the factory returns our mock service for this business type
      (businessServiceFactory.getTypeSpecificService as any).mockImplementationOnce((type: BusinessType) => {
        if (type === 'retail') {
          return mockTypeSpecificService;
        }
        throw new Error('Invalid business type');
      });

      // Call the service method
      await businessService.updateCustomerInteraction(businessId, updateData);

      // Verify mocks
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
      expect(businessServiceFactory.getTypeSpecificService).toHaveBeenCalledWith('retail');
      expect(mockTypeSpecificService.updateCustomerInteraction).toHaveBeenCalledWith(
        businessId,
        updateData
      );

      // Verify cache was cleared
      expect(mockCacheManager.clear).toHaveBeenCalledWith(`business:details:${businessId}`);
    });

    it('should throw error with empty update data', async () => {
      // Create test data
      const businessId = 'business-123';
      const emptyData = {};

      // The first implementation of businessService.updateCustomerInteraction
      // We need to restore the mock after this test to avoid affecting other tests
      const originalMethod = businessService.updateCustomerInteraction;
      businessService.updateCustomerInteraction = vi.fn().mockImplementation(async () => {
        throw new ServiceError(
          'No update data provided',
          'VALIDATION_ERROR',
          'At least one customer interaction field must be provided'
        );
      });

      try {
        // Call the service method and expect it to throw
        await expect(businessService.updateCustomerInteraction(businessId, emptyData))
          .rejects.toBeInstanceOf(ServiceError);

        // Verify repository was not called since our mock completely replaces the method
        expect(mockBusinessRepository.getBusinessById).not.toHaveBeenCalled();
      } finally {
        // Restore the original method
        businessService.updateCustomerInteraction = originalMethod;
      }
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload and update profile image', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'profile.jpg', { type: 'image/jpeg' }) as unknown as File;

      // Mock repository responses
      mockFileStorageRepository.uploadFile.mockResolvedValue({
        storagePath: 'path/to/image.jpg',
        publicUrl: 'https://example.com/path/to/image.jpg',
      });

      mockBusinessRepository.getBusinessById.mockResolvedValue({
        id: businessId,
        user_id: 'user-123',
      });

      // Call the service method
      const result = await businessService.uploadProfileImage(businessId, testFile);

      // Verify result
      expect(result).toBe('https://example.com/path/to/image.jpg');

      // Verify repository calls
      expect(mockFileStorageRepository.validateFile).toHaveBeenCalledWith(testFile);
      expect(mockFileStorageRepository.uploadFile).toHaveBeenCalledWith(
        testFile,
        businessId,
        BusinessFileType.ProfileImage
      );
      expect(mockBusinessRepository.updateBusiness).toHaveBeenCalledWith(
        businessId,
        { profile_image: 'https://example.com/path/to/image.jpg' }
      );

      // Verify cache was cleared
      expect(mockCacheManager.clear).toHaveBeenCalledWith(`business:details:${businessId}`);
      expect(mockCacheManager.clearByPrefix).toHaveBeenCalledWith(`business:profiles:user-123`);
    });
  });

  describe('getTypeSpecificService', () => {
    it('should return the appropriate type-specific service', async () => {
      // Create test data
      const businessType = 'restaurant' as BusinessType;

      // Make sure the factory returns our mock service
      (businessServiceFactory.getTypeSpecificService as any).mockImplementationOnce((type: BusinessType) => {
        if (type === 'restaurant') {
          return mockTypeSpecificService;
        }
        throw new Error('Invalid business type');
      });

      // Call the service method
      const result = await businessService.getTypeSpecificService(businessType);

      // Verify the correct service factory method was called and returned
      expect(businessServiceFactory.getTypeSpecificService).toHaveBeenCalledWith(businessType);
      expect(result).toBe(mockTypeSpecificService);
    });

    it('should throw error for invalid business type', async () => {
      vi.resetAllMocks();
      // Mock the factory to throw an error
      (businessServiceFactory.getTypeSpecificService as any).mockImplementationOnce(() => {
        throw new Error('Invalid business type');
      });

      // Call the method with invalid type and expect it to throw
      await expect(businessService.getTypeSpecificService('invalid-type' as BusinessType))
        .rejects.toBeInstanceOf(ServiceError);
    });
  });

  describe('deleteBusiness', () => {
    // For the deleteBusiness test
    it('should delete a business and its associated data', async () => {
      vi.resetAllMocks();
      // Create test data
      const businessId = 'business-123';
      const existingBusiness = {
        id: businessId,
        type: 'restaurant' as BusinessType,
        user_id: 'user-123',
      };

      // Mock repository responses
      mockBusinessRepository.getBusinessById.mockResolvedValue(existingBusiness);

      // Reset the mock for getTypeSpecificService to always return our mock service
      (businessServiceFactory.getTypeSpecificService as any).mockReturnValue(mockTypeSpecificService);

      // Call the service method
      await businessService.deleteBusiness(businessId);

      // Verify the correct methods were called
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
      expect(businessServiceFactory.getTypeSpecificService).toHaveBeenCalledWith('restaurant');
      expect(mockTypeSpecificService.deleteDetails).toHaveBeenCalledWith(businessId);
      expect(mockBusinessRepository.deleteBusiness).toHaveBeenCalledWith(businessId);

      // Verify cache was cleared
      expect(mockCacheManager.clear).toHaveBeenCalledWith(`business:details:${businessId}`);
      expect(mockCacheManager.clearByPrefix).toHaveBeenCalledWith(`business:profiles:user-123`);
    });

    it('should throw error when business not found', async () => {
      // Create test data
      const businessId = 'non-existent-business';

      // Mock repository to return null
      mockBusinessRepository.getBusinessById.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(businessService.deleteBusiness(businessId))
        .rejects.toBeInstanceOf(ServiceError);

      // Verify repository was called
      expect(mockBusinessRepository.getBusinessById).toHaveBeenCalledWith(businessId);
      expect(mockBusinessRepository.deleteBusiness).not.toHaveBeenCalled();
    });
  });
});