// src/lib/services/business/types.ts
import { Database } from '@/lib/database/database.types';
import { BusinessType, BusinessWithDetails } from '@/lib/types/database/business.types';

export type BusinessResponse = BusinessWithDetails & {
  restaurant_details_v2?: Array<Database['public']['Tables']['restaurant_details_v2']['Row']> | Database['public']['Tables']['restaurant_details_v2']['Row'];
  retail_details_v2?: Array<Database['public']['Tables']['retail_details_v2']['Row']> | Database['public']['Tables']['retail_details_v2']['Row'];
  service_details_v2?: Array<Database['public']['Tables']['service_details_v2']['Row']> | Database['public']['Tables']['service_details_v2']['Row'];
};

export interface BusinessCreateData {
  user_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_image?: string | File | null;
  type?: BusinessType;
}

export interface BusinessUpdateData {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_image?: string | File | null;
}

// Base interface for common fields across all business types
export interface BaseTypeSpecificDetails {
  operating_hours?: string | null;
  agent_instructions?: string | null;
  ai_communication_style?: string | null;
  greeting_message?: string | null;
  special_instructions?: string | null;
}

export interface RestaurantDetails extends BaseTypeSpecificDetails {
  menu_items?: string | null;
  seating_capacity?: number | null;
  cuisine_type?: string | null;
  delivery_available?: boolean;
  takeout_available?: boolean;
}

export interface RetailDetails extends BaseTypeSpecificDetails {
  store_type?: string | null;
  inventory_size?: number | null;
  has_online_store?: boolean;
  delivery_available?: boolean;
}

export interface ServiceDetails extends BaseTypeSpecificDetails {
  service_type?: string | null;
  service_area?: string | null;
  is_mobile_service?: boolean;
  requires_booking?: boolean;
}

export interface TypeSpecificUpdateData {
  details: RestaurantDetails | RetailDetails | ServiceDetails;
}

export interface CustomerInteractionData {
  ai_communication_style?: string;
  greeting_message?: string;
  special_instructions?: string;
}

export interface IBusinessService {
  getBusinessProfile(userId: string): Promise<BusinessResponse[]>;
  getBusinessById(userId: string): Promise<BusinessResponse>;
  getBusinessDetails(businessId: string): Promise<BusinessResponse>;
  createBusiness(data: BusinessCreateData): Promise<BusinessResponse>;
  updateBusiness(
    businessId: string, 
    data: BusinessUpdateData & TypeSpecificUpdateData
  ): Promise<BusinessResponse>;
  updateCustomerInteraction(
    businessId: string,
    data: CustomerInteractionData
  ): Promise<void>;
  uploadProfileImage(
    businessId: string,
    file: File
  ): Promise<string>;
  deleteBusiness(businessId: string): Promise<void>;
  getTypeSpecificService(businessType: string): Promise<ITypeSpecificBusinessService<any>>;
  
}

/**
 * Base interface for all type-specific business services
 * This ensures consistent method signatures across all specialized services
 */
export interface ITypeSpecificBusinessService<T> {
  /**
   * Get type-specific details for a business
   * @param businessId The ID of the business
   */
  getDetailsByBusinessId(businessId: string): Promise<T | null>;
  
  /**
   * Create type-specific details for a business
   * @param businessId The ID of the business
   * @param data The data to create
   */
  createDetails(businessId: string, data: Partial<T>): Promise<T>;
  
  /**
   * Update type-specific details for a business
   * @param businessId The ID of the business
   * @param data The data to update
   */
  updateDetails(businessId: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete type-specific details for a business
   * @param businessId The ID of the business
   */
  deleteDetails(businessId: string): Promise<void>;
  
  /**
   * Update customer interaction preferences for a business
   * @param businessId The ID of the business
   * @param data The customer interaction data to update
   */
  updateCustomerInteraction(businessId: string, data: {
    ai_communication_style?: string;
    greeting_message?: string;
    special_instructions?: string;
  }): Promise<void>;
}

/**
 * Type-specific interface for restaurant details service
 */
export interface IRestaurantService extends ITypeSpecificBusinessService<RestaurantDetails> {}

/**
 * Type-specific interface for retail details service
 */
export interface IRetailService extends ITypeSpecificBusinessService<RetailDetails> {}

/**
 * Type-specific interface for service business details service
 */
export interface IServiceBusinessService extends ITypeSpecificBusinessService<ServiceDetails> {}

/**
 * Factory interface for getting the appropriate type-specific service
 */
export interface IBusinessServiceFactory {
  getTypeSpecificService(businessType: string): ITypeSpecificBusinessService<any>;
}