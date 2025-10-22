// lib/database/interfaces/business-numbers.interface.ts
import { BusinessNumberRow, BusinessNumberInsert, BusinessNumberUpdate, BusinessNumberWithBusiness, NumberUsageStats } from '@/lib/types/database/numbers.types';
import { IRepository } from './base.repository';

export interface IBusinessNumbersRepository extends IRepository {
  /**
   * Create a new business number
   */
  create(data: BusinessNumberInsert): Promise<BusinessNumberRow>;

  /**
   * Get business number by ID
   */
  getById(id: string): Promise<BusinessNumberRow | null>;

  /**
   * Get business number by phone number
   */
  getByPhoneNumber(phoneNumber: string): Promise<BusinessNumberRow | null>;

  /**
   * Update business number
   */
  update(id: string, data: BusinessNumberUpdate): Promise<BusinessNumberRow>;

  /**
   * Delete business number
   */
  delete(id: string): Promise<void>;

  /**
   * Get all business numbers
   */
  getAll(): Promise<BusinessNumberRow[]>;

  /**
   * Check if business number exists
   */
  exists(id: string): Promise<boolean>;
  /**
   * Get all numbers for a specific business
   */
  getByBusinessId(businessId: string): Promise<BusinessNumberRow[]>;

  /**
   * Get primary number for a business
   */
  getPrimaryByBusinessId(businessId: string): Promise<BusinessNumberRow | null>;

  /**
   * Get numbers with business information
   */
  getNumbersWithBusiness(userId: string): Promise<BusinessNumberWithBusiness[]>;

  /**
   * Set a number as primary (and unset others for the same business)
   */
  setPrimary(id: string, businessId: string): Promise<BusinessNumberRow>;

  /**
   * Toggle number active status
   */
  toggleActive(id: string): Promise<BusinessNumberRow>;

  /**
   * Get usage statistics for a user's numbers
   */
  getUsageStats(userId: string): Promise<NumberUsageStats>;

  /**
   * Search numbers by phone number or display name
   */
  searchNumbers(userId: string, query: string): Promise<BusinessNumberWithBusiness[]>;

  /**
   * Check if a phone number is already in use
   */
  isPhoneNumberInUse(phoneNumber: string, excludeId?: string): Promise<boolean>;

  /**
   * Get all numbers for a user across all businesses
   */
  getAllByUserId(userId: string): Promise<BusinessNumberWithBusiness[]>;
}