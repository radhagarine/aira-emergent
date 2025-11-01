import {
  BusinessResponse,
  BusinessCreateData,
  BusinessUpdateData,
  TypeSpecificUpdateData,
  CustomerInteractionData,
  IBusinessService,
  ITypeSpecificBusinessService
} from './types';

import {
  getRepositoryFactory,
  RepositoryFactory
} from '@/lib/database/repository.factory';

import {
  BusinessType,
  BusinessFileType
} from '@/lib/types/database/business.types';

import { CacheManager } from '@/lib/services/common/cache-manager';
import { DatabaseError, ServiceError } from '@/lib/types/shared/error.types';

import { businessServiceFactory } from '@/lib/services/business/business-service.factory';

export class BusinessService implements IBusinessService {
  private repositoryFactory;
  private businessRepository;
  private fileStorageRepository;
  private cacheManager = new CacheManager();

  constructor(repoFactoryOverride?: RepositoryFactory) {
    this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    this.businessRepository = this.repositoryFactory.getBusinessRepository();
    this.fileStorageRepository = this.repositoryFactory.getFileStorageRepository();
  }

  /**
   * Retrieve business profiles for a user
   */
  async getBusinessProfile(userId: string): Promise<BusinessResponse[]> {
    try {
      // Check cache first
      const cacheKey = `business:profiles:${userId}`;
      const cachedData = this.cacheManager.get<BusinessResponse[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch businesses with their details
      const businesses = await this.businessRepository.getBusinessesWithDetails(userId);

      // Transform the data to match BusinessResponse type
      const transformedBusinesses: BusinessResponse[] = businesses.map(business => {
        const response: BusinessResponse = {
          ...business,
          restaurant_details_v2: business.restaurant_details_v2 || undefined,
          retail_details_v2: business.retail_details_v2 || undefined,
          service_details_v2: business.service_details_v2 || undefined
        };
        return response;
      });

      // Store in cache
      this.cacheManager.set(cacheKey, transformedBusinesses);

      return transformedBusinesses;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to retrieve business profiles',
        'FETCH_PROFILE_ERROR',
        error
      );
    }
  }

  /**
   * Retrieve detailed business information
   */
  async getBusinessDetails(businessId: string): Promise<BusinessResponse> {
    try {
      // Check cache first
      const cacheKey = `business:details:${businessId}`;
      const cachedData = this.cacheManager.get<BusinessResponse>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const businessDetails = await this.businessRepository.getBusinessWithDetails(businessId);

      if (!businessDetails) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }

      // Transform the data to match BusinessResponse type
      const transformedBusiness: BusinessResponse = {
        ...businessDetails,
        restaurant_details_v2: businessDetails.restaurant_details_v2 || undefined,
        retail_details_v2: businessDetails.retail_details_v2 || undefined,
        service_details_v2: businessDetails.service_details_v2 || undefined
      };

      // Store in cache
      this.cacheManager.set(cacheKey, transformedBusiness);

      return transformedBusiness;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to retrieve business details',
        'FETCH_DETAILS_ERROR',
        error
      );
    }
  }

  /**
   * Create a new business
   */
  async createBusiness(data: BusinessCreateData): Promise<BusinessResponse> {
    try {
      // Validate input data
      if (!data.name || !data.user_id) {
        throw ServiceError.create(
          'Invalid business creation data',
          'VALIDATION_ERROR',
          'Business name and user ID are required'
        );
      }

      // Prepare business data for creation
      const businessType = data.type || 'restaurant';
      const businessData = {
        user_id: data.user_id,
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        profile_image: data.profile_image || null,
        type: businessType
      };

      // Create business
      const newBusiness = await this.businessRepository.createBusiness(businessData);

      // Get the appropriate type-specific service using the factory
      const typeSpecificService = businessServiceFactory.getTypeSpecificService(businessType);

      // Create type-specific details with the specialized service
      await typeSpecificService.createDetails(newBusiness.id, {
        ...(businessType === 'restaurant' && {
          delivery_available: false,
          takeout_available: false
        }),
        ...(businessType === 'retail' && {
          has_online_store: false,
          delivery_available: false
        }),
        ...(businessType === 'service' && {
          is_mobile_service: false,
          requires_booking: false
        })
      });

      // Clear cache for user's business profiles
      this.cacheManager.clearByPrefix(`business:profiles:${data.user_id}`);

      // Fetch and return the complete business details
      return await this.getBusinessDetails(newBusiness.id);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to create business',
        'CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Update business details
   */
  async updateBusiness(
    businessId: string,
    data: BusinessUpdateData
  ): Promise<BusinessResponse> {
    try {
      // Get the existing business to determine its type
      const existingBusiness = await this.getBusinessById(businessId);
      if (!existingBusiness) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }

      // Prepare update data with only existing columns
      const coreUpdateData: any = {};

      // Add fields that are present in the update
      if (data.name) coreUpdateData.name = data.name;
      if (data.address !== undefined) coreUpdateData.address = data.address;
      if (data.phone !== undefined) coreUpdateData.phone = data.phone;
      if (data.email !== undefined) coreUpdateData.email = data.email;
      if (data.profile_image) coreUpdateData.profile_image = data.profile_image;

      // Only proceed with core update if there are fields to update
      if (Object.keys(coreUpdateData).length > 0) {
        // Update business core details
        await this.businessRepository.updateBusiness(businessId, coreUpdateData);
      }

      // Clear caches
      this.cacheManager.clear(`business:details:${businessId}`);
      this.cacheManager.clearByPrefix(`business:profiles:${existingBusiness.user_id}`);

      // Fetch and return updated business with details
      return await this.getBusinessDetails(businessId);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to update business details',
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Get a business by ID (without details, more efficient)
   */
  async getBusinessById(businessId: string): Promise<BusinessResponse> {
    try {
      const business = await this.businessRepository.getBusinessById(businessId);
      if (!business) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }
      return business;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to retrieve business',
        'FETCH_ERROR',
        error
      );
    }
  }
  /**
   * Update customer interaction preferences
   */
  async updateCustomerInteraction(
    businessId: string,
    data: CustomerInteractionData
  ): Promise<void> {
    try {
      // Get the existing business to determine its type
      const existingBusiness = await this.getBusinessById(businessId);

      // Use the type-specific service to update customer interaction
      const typeSpecificService = businessServiceFactory.getTypeSpecificService(existingBusiness.type);
      await typeSpecificService.updateCustomerInteraction(businessId, data);

      // Clear caches
      this.cacheManager.clear(`business:details:${businessId}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to update customer interaction preferences',
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(
    businessId: string,
    file: File
  ): Promise<string> {
    try {
      // Validate file (you might want to add more specific image validation)
      this.fileStorageRepository.validateFile(file);

      // Upload file to storage specifically for profile images
      const uploadResult = await this.fileStorageRepository.uploadFile(
        file,
        businessId,
        BusinessFileType.ProfileImage
      );

      // Update business record with new profile image URL
      await this.businessRepository.updateBusiness(businessId, {
        profile_image: uploadResult.publicUrl
      });

      // Clear caches
      this.cacheManager.clear(`business:details:${businessId}`);

      // Get business to clear user-level cache
      const business = await this.businessRepository.getBusinessById(businessId);
      if (business) {
        this.cacheManager.clearByPrefix(`business:profiles:${business.user_id}`);
      }

      return uploadResult.publicUrl;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to upload profile image',
        'PROFILE_IMAGE_UPLOAD_ERROR',
        error
      );
    }
  }

  // src/lib/services/business/business.service.ts
  /**
   * Get the appropriate type-specific service for a business type
   * This is made async to follow the pattern of other service methods
   * and allow for future extension (like fetching service configurations)
   */
  async getTypeSpecificService(businessType: BusinessType): Promise<ITypeSpecificBusinessService<any>> {
    try {
      // Validate business type
      const validTypes = ['restaurant', 'retail', 'service'];
      if (!validTypes.includes(businessType)) {
        throw ServiceError.create(
          `Invalid business type: ${businessType}`,
          'INVALID_BUSINESS_TYPE',
          `Business type must be one of: ${validTypes.join(', ')}`
        );
      }

      // For now, we simply delegate to the factory
      // In the future, this could include fetching configurations, 
      // validating permissions, etc.
      return businessServiceFactory.getTypeSpecificService(businessType);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get type-specific service',
        'SERVICE_ERROR',
        error
      );
    }
  }
  /**
 * Delete a business and its associated data
 */
  async deleteBusiness(businessId: string): Promise<void> {
    try {
      // Check if business exists and get its details
      const existingBusiness = await this.getBusinessById(businessId);

      // Get the appropriate type-specific service
      const typeSpecificService = businessServiceFactory.getTypeSpecificService(existingBusiness.type);

      // First delete type-specific details
      await typeSpecificService.deleteDetails(businessId);

      // Then delete the business itself
      await this.businessRepository.deleteBusiness(businessId);

      // Clear caches
      this.cacheManager.clear(`business:details:${businessId}`);
      this.cacheManager.clearByPrefix(`business:profiles:${existingBusiness.user_id}`);

    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to delete business',
        'DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Clear cache for a user's business profiles
   * Useful when external changes affect business data (e.g., phone number linking)
   */
  clearUserCache(userId: string): void {
    console.log('[BusinessService] Clearing cache for user:', userId);
    this.cacheManager.clearByPrefix(`business:profiles:${userId}`);
    console.log('[BusinessService] Cache cleared');
  }
}

// Export a singleton instance
export const businessService = new BusinessService();