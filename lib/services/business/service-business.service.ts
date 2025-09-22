// src/lib/services/business/service-business.service.ts
import { BaseTypeSpecificService } from './base-type-specific.service';
import { IServiceBusinessService } from '@/lib/services/business/types';
import { ServiceDetails } from './types';
import { getRepositoryFactory, RepositoryFactory } from '@/lib/database/repository.factory';

/**
 * Service for managing service-type business details
 */
export class ServiceBusinessService extends BaseTypeSpecificService<ServiceDetails> implements IServiceBusinessService {
  constructor(repoFactoryOverride?: RepositoryFactory) {
    const repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    super(
      repositoryFactory,
      (factory) => factory.getServiceDetailsRepository(),
      'service'
    );
  }
  
  /**
   * Get service business details with specialized handling
   */
  override async getDetailsByBusinessId(businessId: string): Promise<ServiceDetails | null> {
    const details = await super.getDetailsByBusinessId(businessId);
    
    if (!details) {
      return null;
    }
    
    // Add any service business-specific transformations here
    return {
      service_type: details.service_type || '',
      service_area: details.service_area || '',
      is_mobile_service: details.is_mobile_service === true,
      requires_booking: details.requires_booking === true,
      operating_hours: details.operating_hours || '',
      agent_instructions: details.agent_instructions || '',
      ai_communication_style: details.ai_communication_style || '',
      greeting_message: details.greeting_message || '',
      special_instructions: details.special_instructions || ''
    };
  }
  
  /**
   * Validate service area
   * @param serviceArea The proposed service area
   */
  async validateServiceArea(serviceArea: string): Promise<void> {
    // Example validation - implement business rules here
    if (serviceArea && serviceArea.length > 100) {
      throw new Error('Service area description too long');
    }
  }
}

// Export a singleton instance
export const serviceBusinessService = new ServiceBusinessService();