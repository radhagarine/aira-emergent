// lib/services/numbers/business-numbers.service.ts
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { IBusinessNumbersRepository } from '@/lib/database/interfaces/business-numbers.interface';
import { BaseService } from '@/lib/services/common/base.service';
import {
  BusinessNumberRow,
  BusinessNumberInsert,
  BusinessNumberUpdate,
  BusinessNumberWithBusiness,
  NumberUsageStats,
  BusinessNumberType
} from '@/lib/types/database/numbers.types';
import {
  IBusinessNumbersService,
  ValidationResult,
  NumberFormData
} from './types';

export class BusinessNumbersService extends BaseService implements IBusinessNumbersService {
  private numbersRepository: IBusinessNumbersRepository;
  private static instanceCount = 0;
  private instanceId: number;

  constructor(repositoryFactory: RepositoryFactory) {
    super(repositoryFactory);
    this.instanceId = ++BusinessNumbersService.instanceCount;
    console.log(`[BusinessNumbersService] NEW INSTANCE CREATED #${this.instanceId}`);
    this.numbersRepository = this.repositoryFactory.getBusinessNumbersRepository();
  }

  async createNumber(data: BusinessNumberInsert): Promise<BusinessNumberRow> {
    try {
      // Validate the phone number before creating
      const validation = await this.validatePhoneNumber(data.phone_number);
      if (!validation.isValid || !validation.isAvailable) {
        throw new Error(`Invalid or unavailable phone number: ${validation.errors.join(', ')}`);
      }

      // If this is set as primary, ensure no other number is primary for this business
      // Only check if business_id is provided (number is assigned to a business)
      if (data.is_primary && data.business_id) {
        const existingPrimary = await this.numbersRepository.getPrimaryByBusinessId(data.business_id);
        if (existingPrimary) {
          await this.numbersRepository.update(existingPrimary.id, { is_primary: false });
        }
      }

      const result = await this.numbersRepository.create({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Only clear business cache if number is assigned to a business
      if (data.business_id) {
        this.clearCacheForBusiness(data.business_id);
      }
      return result;
    } catch (error) {
      console.error('Error creating business number:', error);
      throw error;
    }
  }

  async getNumberById(id: string): Promise<BusinessNumberRow | null> {
    try {
      const cacheKey = `business_number_${id}`;
      const cached = this.getFromCache<BusinessNumberRow>(cacheKey);
      if (cached) return cached;

      const result = await this.numbersRepository.getById(id);
      if (result) {
        this.setCache(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error('Error getting business number:', error);
      throw error;
    }
  }

  async updateNumber(id: string, data: BusinessNumberUpdate): Promise<BusinessNumberRow> {
    try {
      // If updating phone number, validate it
      if (data.phone_number) {
        const validation = await this.validatePhoneNumber(data.phone_number, id);
        if (!validation.isValid || !validation.isAvailable) {
          throw new Error(`Invalid or unavailable phone number: ${validation.errors.join(', ')}`);
        }
      }

      const current = await this.numbersRepository.getById(id);
      if (!current) {
        throw new Error('Business number not found');
      }

      // If setting as primary, unset others for the same business
      // Only if the number is assigned to a business
      if (data.is_primary && !current.is_primary && current.business_id) {
        await this.setPrimaryNumber(id, current.business_id);
        return await this.numbersRepository.getById(id) as BusinessNumberRow;
      }

      const result = await this.numbersRepository.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      });

      // Only clear business cache if number is assigned to a business
      if (current.business_id) {
        this.clearCacheForBusiness(current.business_id);
      }
      this.clearCache(`business_number_${id}`);
      return result;
    } catch (error) {
      console.error('Error updating business number:', error);
      throw error;
    }
  }

  async deleteNumber(id: string): Promise<void> {
    try {
      const current = await this.numbersRepository.getById(id);
      if (!current) {
        throw new Error('Business number not found');
      }

      // Don't allow deletion of primary numbers if there are other numbers for the same business
      // Only check if number is assigned to a business
      if (current.is_primary && current.business_id) {
        const businessNumbers = await this.numbersRepository.getByBusinessId(current.business_id);
        if (businessNumbers.length > 1) {
          throw new Error('Cannot delete primary number. Please set another number as primary first.');
        }
      }

      await this.numbersRepository.delete(id);
      // Only clear business cache if number is assigned to a business
      if (current.business_id) {
        this.clearCacheForBusiness(current.business_id);
      }
      this.clearCache(`business_number_${id}`);
    } catch (error) {
      console.error('Error deleting business number:', error);
      throw error;
    }
  }

  async getNumbersByBusinessId(businessId: string): Promise<BusinessNumberRow[]> {
    try {
      const cacheKey = `business_numbers_${businessId}`;
      const cached = this.getFromCache<BusinessNumberRow[]>(cacheKey);
      if (cached) return cached;

      const result = await this.numbersRepository.getByBusinessId(businessId);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting numbers by business ID:', error);
      throw error;
    }
  }

  async getAllNumbersByUserId(userId: string): Promise<BusinessNumberWithBusiness[]> {
    try {
      console.log(`[BusinessNumbersService #${this.instanceId}] getAllNumbersByUserId called for user:`, userId);

      // NO CACHING - just fetch directly from repository every time
      const result = await this.numbersRepository.getAllByUserId(userId);
      console.log(`[BusinessNumbersService #${this.instanceId}] Repository returned:`, result?.length || 0, 'items');

      return result;
    } catch (error) {
      console.error('[BusinessNumbersService] Error getting all numbers by user ID:', error);
      throw error;
    }
  }

  async getPrimaryNumber(businessId: string): Promise<BusinessNumberRow | null> {
    try {
      const cacheKey = `primary_number_${businessId}`;
      const cached = this.getFromCache<BusinessNumberRow>(cacheKey);
      if (cached) return cached;

      const result = await this.numbersRepository.getPrimaryByBusinessId(businessId);
      if (result) {
        this.setCache(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error('Error getting primary number:', error);
      throw error;
    }
  }

  async setPrimaryNumber(id: string, businessId: string): Promise<BusinessNumberRow> {
    try {
      const result = await this.numbersRepository.setPrimary(id, businessId);
      this.clearCacheForBusiness(businessId);
      return result;
    } catch (error) {
      console.error('Error setting primary number:', error);
      throw error;
    }
  }

  async toggleNumberActive(id: string): Promise<BusinessNumberRow> {
    try {
      const current = await this.numbersRepository.getById(id);
      if (!current) {
        throw new Error('Business number not found');
      }

      // Don't allow deactivating primary numbers (only if assigned to a business)
      if (current.is_primary && current.is_active && current.business_id) {
        throw new Error('Cannot deactivate primary number. Please set another number as primary first.');
      }

      const result = await this.numbersRepository.toggleActive(id);
      // Only clear business cache if number is assigned to a business
      if (current.business_id) {
        this.clearCacheForBusiness(current.business_id);
      }
      this.clearCache(`business_number_${id}`);
      return result;
    } catch (error) {
      console.error('Error toggling number active status:', error);
      throw error;
    }
  }

  async getUsageStatistics(userId: string): Promise<NumberUsageStats> {
    try {
      const cacheKey = `usage_stats_${userId}`;
      const cached = this.getFromCache<NumberUsageStats>(cacheKey);
      if (cached) return cached;

      const result = await this.numbersRepository.getUsageStats(userId);
      this.setCache(cacheKey, result, 600); // 10-minute cache
      return result;
    } catch (error) {
      console.error('Error getting usage statistics:', error);
      throw error;
    }
  }

  async searchNumbers(userId: string, query: string): Promise<BusinessNumberWithBusiness[]> {
    try {
      if (!query.trim()) {
        return this.getAllNumbersByUserId(userId);
      }

      const result = await this.numbersRepository.searchNumbers(userId, query.trim());
      return result;
    } catch (error) {
      console.error('Error searching numbers:', error);
      throw error;
    }
  }

  async validatePhoneNumber(phoneNumber: string, excludeId?: string): Promise<ValidationResult> {
    try {
      const errors: string[] = [];

      // Basic format validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s|-|\(|\)/g, ''))) {
        errors.push('Invalid phone number format');
      }

      // Check if number is already in use
      const isInUse = await this.numbersRepository.isPhoneNumberInUse(phoneNumber, excludeId);

      return {
        isValid: errors.length === 0,
        isAvailable: !isInUse,
        errors: isInUse ? [...errors, 'Phone number is already in use'] : errors
      };
    } catch (error) {
      console.error('Error validating phone number:', error);
      return {
        isValid: false,
        isAvailable: false,
        errors: ['Error validating phone number']
      };
    }
  }

  formatPhoneNumber(phoneNumber: string, countryCode: string): string {
    // Simple formatting - can be enhanced with a library like libphonenumber-js
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (countryCode === 'US' && cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phoneNumber;
  }

  getAvailableNumberTypes(): BusinessNumberType[] {
    return Object.values(BusinessNumberType);
  }

  async bulkUpdateNumbers(updates: Array<{ id: string; data: BusinessNumberUpdate }>): Promise<BusinessNumberRow[]> {
    try {
      const results: BusinessNumberRow[] = [];
      const businessIds = new Set<string>();

      for (const update of updates) {
        const result = await this.numbersRepository.update(update.id, {
          ...update.data,
          updated_at: new Date().toISOString()
        });
        results.push(result);
        // Only add to set if business_id is not null
        if (result.business_id) {
          businessIds.add(result.business_id);
        }
      }

      // Clear cache for all affected businesses
      businessIds.forEach(businessId => {
        this.clearCacheForBusiness(businessId);
      });

      return results;
    } catch (error) {
      console.error('Error bulk updating numbers:', error);
      throw error;
    }
  }

  private clearCacheForBusiness(businessId: string): void {
    this.clearCache(`business_numbers_${businessId}`);
    this.clearCache(`primary_number_${businessId}`);
    // Also clear user cache - we don't have userId here, so this is a limitation
    // In a real app, you might want to structure this differently
  }
}