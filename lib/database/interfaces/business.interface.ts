import { 
    BusinessV2Row, 
    BusinessV2Insert, 
    BusinessV2Update,
    BusinessType,
    BusinessWithDetails
  } from '../../types/database/business.types';
  import { IRepository } from '@/lib/database/interfaces/base.repository';
  import { IFileStorageRepository } from '@/lib/database/interfaces/file-storage.interface'
  
  export interface IBusinessRepository extends IRepository {
    /**
     * Get all businesses for a user
     */
    getBusinessesByUserId(userId: string): Promise<BusinessV2Row[]>;
  
    /**
     * Get a single business by ID
     */
    getBusinessById(id: string): Promise<BusinessV2Row | null>;

    /**
     * Get a single business by ID with its type-specific details
     */
    getBusinessWithDetails(id: string): Promise<BusinessWithDetails | null>;

    /**
     * Get a single business by user with its type-specific details
     */
    getBusinessesWithDetails(userId: string): Promise<BusinessWithDetails[]>;
  
    /**
     * Create a new business
     */
    createBusiness(data: BusinessV2Insert): Promise<BusinessV2Row>;
  
    /**
     * Update an existing business
     */
    updateBusiness(id: string, data: BusinessV2Update): Promise<BusinessWithDetails>;
  
    /**
     * Delete a business and all its related data
     */
    deleteBusiness(id: string): Promise<void>;
  
    /**
     * Get businesses by type with their details
     */
    getBusinessesByType(type: BusinessType): Promise<BusinessWithDetails[]>;
  
    /**
     * Check if a business exists
     */
    exists(id: string): Promise<boolean>;
  }