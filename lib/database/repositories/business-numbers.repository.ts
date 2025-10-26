// lib/database/repositories/business-numbers.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IBusinessNumbersRepository } from '@/lib/database/interfaces/business-numbers.interface';
import {
  BusinessNumberRow,
  BusinessNumberInsert,
  BusinessNumberUpdate,
  BusinessNumberWithBusiness,
  NumberUsageStats,
  BusinessNumberType
} from '@/lib/types/database/numbers.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

export class BusinessNumbersRepository implements IBusinessNumbersRepository {
  private readonly tableName = 'business_numbers';

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly factory: RepositoryFactory
  ) {}

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getFactory(): RepositoryFactory {
    return this.factory;
  }

  async create(data: BusinessNumberInsert): Promise<BusinessNumberRow> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to create business number`,
          error.code,
          error.message
        );
      }

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to create business number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getById(id: string): Promise<BusinessNumberRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw new DatabaseError(
          `Failed to get business number ${id}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get business number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getByPhoneNumber(phoneNumber: string): Promise<BusinessNumberRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(
          `Failed to get business number by phone ${phoneNumber}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get business number by phone', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async update(id: string, data: BusinessNumberUpdate): Promise<BusinessNumberRow> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to update business number ${id}`,
          error.code,
          error.message
        );
      }

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to update business number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete business number ${id}`,
          error.code,
          error.message
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to delete business number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getAll(): Promise<BusinessNumberRow[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          'Failed to get all business numbers',
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get all business numbers', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(
          `Failed to check if business number ${id} exists`,
          error.code,
          error.message
        );
      }

      return !!data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to check business number existence', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getByBusinessId(businessId: string): Promise<BusinessNumberRow[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get numbers for business ${businessId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get numbers by business ID', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getPrimaryByBusinessId(businessId: string): Promise<BusinessNumberRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) {
        throw new DatabaseError(
          `Failed to get primary number for business ${businessId}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get primary number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getNumbersWithBusiness(userId: string): Promise<BusinessNumberWithBusiness[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          business:business_v2!inner(id, name, type, user_id)
        `)
        .eq('business.user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get numbers with business for user ${userId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get numbers with business', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async setPrimary(id: string, businessId: string): Promise<BusinessNumberRow> {
    try {
      // First, unset all primary numbers for this business
      await this.supabase
        .from(this.tableName)
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('business_id', businessId);

      // Then set the selected number as primary
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to set number ${id} as primary`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to set primary number', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async toggleActive(id: string): Promise<BusinessNumberRow> {
    try {
      // First get current status
      const current = await this.getById(id);
      if (!current) {
        throw new DatabaseError('Number not found', 'NOT_FOUND', 'The specified number does not exist');
      }

      // Toggle active status
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          is_active: !current.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to toggle active status for number ${id}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to toggle active status', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getUsageStats(userId: string): Promise<NumberUsageStats> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          is_active,
          is_primary,
          number_type,
          monthly_cost,
          business:business_v2!inner(user_id)
        `)
        .eq('business.user_id', userId);

      if (error) {
        throw new DatabaseError(
          `Failed to get usage stats for user ${userId}`,
          error.code,
          error.message
        );
      }

      const numbers = data || [];

      const stats: NumberUsageStats = {
        total_numbers: numbers.length,
        active_numbers: numbers.filter(n => n.is_active).length,
        primary_numbers: numbers.filter(n => n.is_primary).length,
        by_type: Object.values(BusinessNumberType).reduce((acc, type) => {
          acc[type] = numbers.filter(n => n.number_type === type).length;
          return acc;
        }, {} as Record<BusinessNumberType, number>),
        total_monthly_cost: numbers.reduce((sum, n) => sum + (n.monthly_cost || 0), 0)
      };

      return stats;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get usage stats', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async searchNumbers(userId: string, query: string): Promise<BusinessNumberWithBusiness[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          business:business_v2!inner(id, name, type, user_id)
        `)
        .eq('business.user_id', userId)
        .or(`phone_number.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to search numbers for user ${userId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to search numbers', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async isPhoneNumberInUse(phoneNumber: string, excludeId?: string): Promise<boolean> {
    try {
      // Use database function to bypass RLS for duplicate checking
      // This is safe because it only returns a boolean, not actual data
      const { data, error } = await this.supabase
        .rpc('phone_number_exists', { p_phone_number: phoneNumber });

      if (error) {
        throw new DatabaseError(
          `Failed to check if phone number ${phoneNumber} is in use`,
          error.code,
          error.message
        );
      }

      // If excludeId is provided and number exists, check if it's the excluded one
      if (data && excludeId) {
        const { data: existingNumber } = await this.supabase
          .from(this.tableName)
          .select('id')
          .eq('phone_number', phoneNumber)
          .eq('id', excludeId)
          .maybeSingle();

        // If the existing number is the one we're excluding, it's not "in use" by others
        return !existingNumber;
      }

      return !!data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to check phone number usage', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getAllByUserId(userId: string): Promise<BusinessNumberWithBusiness[]> {
    try {
      // Strategy: Get numbers owned by user directly (user_id column)
      const { data: directNumbers, error: directError } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          business:business_v2(id, name, type, user_id)
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (directError) {
        console.error('[BusinessNumbersRepository] Error fetching direct numbers:', directError);
        throw new DatabaseError(
          `Failed to get direct numbers for user ${userId}`,
          directError.code,
          directError.message
        );
      }

      // Also get numbers linked through businesses
      const { data: businessNumbers, error: businessError } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          business:business_v2!inner(id, name, type, user_id)
        `)
        .eq('business.user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (businessError) {
        console.error('[BusinessNumbersRepository] Error fetching business numbers:', businessError);
        // Don't throw here, just log - we can still return direct numbers
      }

      // Merge and deduplicate by id
      const allNumbers = [...(directNumbers || []), ...(businessNumbers || [])];
      const uniqueNumbers = Array.from(
        new Map(allNumbers.map(num => [num.id, num])).values()
      );

      return uniqueNumbers;
    } catch (error) {
      console.error('[BusinessNumbersRepository] getAllByUserId error:', error);
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Failed to get all numbers by user ID', 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}