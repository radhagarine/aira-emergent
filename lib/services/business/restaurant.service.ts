// src/lib/services/business/restaurant.service.ts
import { BaseTypeSpecificService } from './base-type-specific.service';
import { IRestaurantService } from '@/lib/services/business/types';
import { RestaurantDetails } from './types';
import { getRepositoryFactory, RepositoryFactory } from '@/lib/database/repository.factory';

/**
 * Service for managing restaurant-specific business details
 */
export class RestaurantService extends BaseTypeSpecificService<RestaurantDetails> implements IRestaurantService {
  constructor(repoFactoryOverride?: RepositoryFactory) {
    const repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    super(
      repositoryFactory,
      (factory) => factory.getRestaurantDetailsRepository(),
      'restaurant'
    );
  }
  
  /**
   * Get restaurant details with specialized handling
   */
  override async getDetailsByBusinessId(businessId: string): Promise<RestaurantDetails | null> {
    const details = await super.getDetailsByBusinessId(businessId);
    
    if (!details) {
      return null;
    }
    
    // Add any restaurant-specific transformations here
    return {
      menu_items: details.menu_items || '',
      seating_capacity: details.seating_capacity || null,
      cuisine_type: details.cuisine_type || '',
      delivery_available: details.delivery_available === true,
      takeout_available: details.takeout_available === true,
      operating_hours: details.operating_hours || '',
      agent_instructions: details.agent_instructions || '',
      ai_communication_style: details.ai_communication_style || '',
      greeting_message: details.greeting_message || '',
      special_instructions: details.special_instructions || ''
    };
  }
  
  /**
   * Check seating capacity constraints
   * @param seatingCapacity The proposed seating capacity
   */
  async validateSeatingCapacity(seatingCapacity: number | null): Promise<void> {
    // Example validation - implement business rules here
    if (seatingCapacity !== null && seatingCapacity < 0) {
      throw new Error('Seating capacity cannot be negative');
    }
  }
}

// Export a singleton instance
export const restaurantService = new RestaurantService();