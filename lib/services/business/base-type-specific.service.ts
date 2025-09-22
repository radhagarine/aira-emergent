// src/lib/services/business/base-type-specific.service.ts
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { 
  ITypeSpecificBusinessService 
} from '@/lib/services/business/types';
import { DatabaseError, ServiceError } from '@/lib/types/shared/error.types';

/**
 * Base abstract class for all type-specific business services
 * Implements common functionality and error handling
 */
export abstract class BaseTypeSpecificService<T> implements ITypeSpecificBusinessService<T> {
  protected constructor(
    protected readonly repositoryFactory: RepositoryFactory,
    protected readonly repositoryGetter: (factory: RepositoryFactory) => any,
    protected readonly businessType: string
  ) {}

  /**
   * Get the repository for this business type
   */
  protected getRepository() {
    return this.repositoryGetter(this.repositoryFactory);
  }

  /**
   * Validate that the business exists and has the correct type
   */
  protected async validateBusiness(businessId: string): Promise<void> {
    try {
      const businessRepository = this.repositoryFactory.getBusinessRepository();
      
      // Check if business exists
      const exists = await businessRepository.exists(businessId);
      if (!exists) {
        throw ServiceError.create(
          `Business with ID ${businessId} not found`,
          'NOT_FOUND',
          'No business found with the given ID'
        );
      }
      
      // Check if business is of the correct type
      const business = await businessRepository.getBusinessById(businessId);
      if (business?.type !== this.businessType) {
        throw ServiceError.create(
          `Business is not of type ${this.businessType}`,
          'INVALID_BUSINESS_TYPE',
          `This business is of type ${business?.type}, not ${this.businessType}`
        );
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        'Failed to validate business',
        'VALIDATION_ERROR',
        error
      );
    }
  }

  /**
   * Get type-specific details for a business
   */
  async getDetailsByBusinessId(businessId: string): Promise<T | null> {
    try {
      // Validate business exists and has correct type
      await this.validateBusiness(businessId);
      
      // Get details from repository
      const repository = this.getRepository();
      const details = await repository.getByBusinessId(businessId);
      
      return details;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        `Failed to get ${this.businessType} details`,
        'FETCH_DETAILS_ERROR',
        error
      );
    }
  }

  /**
   * Create type-specific details for a business
   */
  async createDetails(businessId: string, data: Partial<T>): Promise<T> {
    try {
      // Validate business exists and has correct type
      await this.validateBusiness(businessId);
      
      // Create details with repository
      const repository = this.getRepository();
      
      const createData = {
        business_id: businessId,
        ...data
      };
      
      const details = await repository.create(createData);
      
      return details;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        `Failed to create ${this.businessType} details`,
        'CREATE_DETAILS_ERROR',
        error
      );
    }
  }

  /**
   * Update type-specific details for a business
   */
  async updateDetails(businessId: string, data: Partial<T>): Promise<T> {
    try {
      // Validate business exists and has correct type
      await this.validateBusiness(businessId);
      
      // Get existing details
      const repository = this.getRepository();
      const existingDetails = await repository.getByBusinessId(businessId);
      
      if (!existingDetails) {
        // Create details if they don't exist
        return this.createDetails(businessId, data);
      }
      
      // Update existing details
      const updatedDetails = await repository.update(existingDetails.id, data);
      
      return updatedDetails;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        `Failed to update ${this.businessType} details`,
        'UPDATE_DETAILS_ERROR',
        error
      );
    }
  }

  /**
   * Delete type-specific details for a business
   */
  async deleteDetails(businessId: string): Promise<void> {
    try {
      // Validate business exists and has correct type
      await this.validateBusiness(businessId);
      
      // Get existing details
      const repository = this.getRepository();
      const existingDetails = await repository.getByBusinessId(businessId);
      
      // Nothing to delete if no details exist
      if (!existingDetails) {
        return;
      }
      
      // Delete details
      await repository.delete(existingDetails.id);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        `Failed to delete ${this.businessType} details`,
        'DELETE_DETAILS_ERROR',
        error
      );
    }
  }

  /**
   * Update customer interaction preferences for a business
   */
  async updateCustomerInteraction(
    businessId: string, 
    data: {
      ai_communication_style?: string;
      greeting_message?: string;
      special_instructions?: string;
    }
  ): Promise<void> {
    try {
      // Validate input
      if (!data.ai_communication_style && 
          !data.greeting_message && 
          !data.special_instructions) {
        throw ServiceError.create(
          'No update data provided',
          'VALIDATION_ERROR',
          'At least one customer interaction field must be provided'
        );
      }
      
      // Validate business exists and has correct type
      await this.validateBusiness(businessId);
      
      // Get existing details
      const repository = this.getRepository();
      const existingDetails = await repository.getByBusinessId(businessId);
      
      // Update details with customer interaction data
      if (existingDetails) {
        await repository.update(existingDetails.id, data);
      } else {
        // Create details with customer interaction data if none exist
        await repository.create({
          business_id: businessId,
          ...data
        });
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      
      throw ServiceError.create(
        'Failed to update customer interaction preferences',
        'UPDATE_ERROR',
        error
      );
    }
  }
}