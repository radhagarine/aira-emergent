// src/lib/services/business/business-service.factory.ts
import { RepositoryFactory, getRepositoryFactory } from '@/lib/database/repository.factory';
import { BusinessType } from '@/lib/types/database/business.types';
import { ITypeSpecificBusinessService } from '@/lib/services/business/types';
import { RestaurantService } from '@/lib/services/business/restaurant.service';
import { RetailService } from '@/lib/services/business/retail.service';
import { ServiceBusinessService } from '@/lib/services/business/service-business.service';

/**
 * Factory for getting the appropriate type-specific business service
 */
export class BusinessServiceFactory {
  constructor(private readonly repositoryFactory?: RepositoryFactory) {}

  /**
   * Get the appropriate type-specific service based on business type
   * @param businessType The type of business
   * @returns The appropriate type-specific service
   */
  getTypeSpecificService(businessType: BusinessType): ITypeSpecificBusinessService<any> {
    const repoFactory = this.repositoryFactory || getRepositoryFactory();
    
    switch (businessType) {
      case 'restaurant':
        return new RestaurantService(repoFactory);
      case 'retail':
        return new RetailService(repoFactory);
      case 'service':
        return new ServiceBusinessService(repoFactory);
      default:
        throw new Error(`Unsupported business type: ${businessType}`);
    }
  }
}

// Export a singleton instance
export const businessServiceFactory = new BusinessServiceFactory();