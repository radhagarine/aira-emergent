// lib/services/numbers/types.ts
import {
  BusinessNumberRow,
  BusinessNumberInsert,
  BusinessNumberUpdate,
  BusinessNumberWithBusiness,
  NumberUsageStats,
  BusinessNumberType
} from '@/lib/types/database/numbers.types';

export interface IBusinessNumbersService {
  /**
   * Create a new business number
   */
  createNumber(data: BusinessNumberInsert): Promise<BusinessNumberRow>;

  /**
   * Get a business number by ID
   */
  getNumberById(id: string): Promise<BusinessNumberRow | null>;

  /**
   * Update a business number
   */
  updateNumber(id: string, data: BusinessNumberUpdate): Promise<BusinessNumberRow>;

  /**
   * Delete a business number
   */
  deleteNumber(id: string): Promise<void>;

  /**
   * Get all numbers for a specific business
   */
  getNumbersByBusinessId(businessId: string): Promise<BusinessNumberRow[]>;

  /**
   * Get all numbers for a user across all their businesses
   */
  getAllNumbersByUserId(userId: string): Promise<BusinessNumberWithBusiness[]>;

  /**
   * Get the primary number for a business
   */
  getPrimaryNumber(businessId: string): Promise<BusinessNumberRow | null>;

  /**
   * Set a number as primary for a business
   */
  setPrimaryNumber(id: string, businessId: string): Promise<BusinessNumberRow>;

  /**
   * Toggle active status of a number
   */
  toggleNumberActive(id: string): Promise<BusinessNumberRow>;

  /**
   * Get usage statistics for a user's numbers
   */
  getUsageStatistics(userId: string): Promise<NumberUsageStats>;

  /**
   * Search numbers by phone number or display name
   */
  searchNumbers(userId: string, query: string): Promise<BusinessNumberWithBusiness[]>;

  /**
   * Validate phone number format and availability
   */
  validatePhoneNumber(phoneNumber: string, excludeId?: string): Promise<ValidationResult>;

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string): string;

  /**
   * Get available number types
   */
  getAvailableNumberTypes(): BusinessNumberType[];

  /**
   * Bulk update numbers
   */
  bulkUpdateNumbers(updates: Array<{ id: string; data: BusinessNumberUpdate }>): Promise<BusinessNumberRow[]>;
}

export interface ValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  errors: string[];
  suggestions?: string[];
}

export interface NumberFormData {
  phoneNumber: string;
  displayName: string;
  countryCode: string;
  numberType: BusinessNumberType;
  provider?: string;
  monthlyCoast?: number;
  features?: string[];
  notes?: string;
}

export interface NumberFilters {
  businessId?: string;
  numberType?: BusinessNumberType;
  isActive?: boolean;
  isPrimary?: boolean;
  provider?: string;
}

export interface NumberSearchParams {
  query?: string;
  filters?: NumberFilters;
  sortBy?: 'created_at' | 'display_name' | 'phone_number' | 'monthly_cost';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}