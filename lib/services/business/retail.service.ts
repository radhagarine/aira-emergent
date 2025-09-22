// src/lib/services/business/retail.service.ts
import { BaseTypeSpecificService } from './base-type-specific.service';
import { IRetailService } from '@/lib/services/business/types';
import { RetailDetails } from './types';
import { getRepositoryFactory, RepositoryFactory } from '@/lib/database/repository.factory';

/**
 * Service for managing retail-specific business details
 */
export class RetailService extends BaseTypeSpecificService<RetailDetails> implements IRetailService {
  constructor(repoFactoryOverride?: RepositoryFactory) {
    const repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    super(
      repositoryFactory,
      (factory) => factory.getRetailDetailsRepository(),
      'retail'
    );
  }
  
  /**
   * Get retail details with specialized handling
   */
  override async getDetailsByBusinessId(businessId: string): Promise<RetailDetails | null> {
    const details = await super.getDetailsByBusinessId(businessId);
    
    if (!details) {
      return null;
    }
    
    // Add any retail-specific transformations here
    return {
      store_type: details.store_type || '',
      inventory_size: details.inventory_size || null,
      has_online_store: details.has_online_store === true,
      delivery_available: details.delivery_available === true,
      operating_hours: details.operating_hours || '',
      agent_instructions: details.agent_instructions || '',
      ai_communication_style: details.ai_communication_style || '',
      greeting_message: details.greeting_message || '',
      special_instructions: details.special_instructions || ''
    };
  }
  
  /**
   * Validate inventory size
   * @param inventorySize The proposed inventory size
   */
  async validateInventorySize(inventorySize: number | null): Promise<void> {
    // Example validation - implement business rules here
    if (inventorySize !== null && inventorySize < 0) {
      throw new Error('Inventory size cannot be negative');
    }
  }
}

// Export a singleton instance
export const retailService = new RetailService();