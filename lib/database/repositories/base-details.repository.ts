import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IRepository } from '../interfaces/base.repository';
import { DatabaseError } from '@/lib/types/shared/error.types';
import { BusinessType } from '@/lib/types/database/business.types';

export abstract class BaseDetailsRepository implements IRepository {
    protected constructor(
        private readonly supabase: SupabaseClient,
        private readonly factory: RepositoryFactory,
        protected readonly tableName: string,
        protected readonly businessType: BusinessType
    ) {}

    getClient(): SupabaseClient {
        return this.supabase;
    }

    getFactory(): RepositoryFactory {
        return this.factory;
    }

    protected async validateBusiness(businessId: string): Promise<void> {
        // Basic validation for empty business ID
        if (!businessId || businessId.trim() === '') {
            throw new DatabaseError(
                'Invalid business ID',
                'VALIDATION_ERROR',
                'Business ID cannot be empty'
            );
        }
        
        const businessRepo = this.factory.getBusinessRepository();
        
        // Check if business exists
        const exists = await businessRepo.exists(businessId);
        if (!exists) {
            throw new DatabaseError(
                `Business ${businessId} not found`,
                'NOT_FOUND',
                'Business does not exist'
            );
        }

        // Check business type
        const business = await businessRepo.getBusinessById(businessId);
        if (business?.type !== this.businessType) {
            throw new DatabaseError(
                `Invalid business type for ${businessId}`,
                'INVALID_TYPE',
                `Business is not of type ${this.businessType}`
            );
        }
    }

    protected async getDetailsById(id: string): Promise<any | null> {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new DatabaseError(
                    `Failed to get details for ${id}`,
                    error.code,
                    error.message
                );
            }

            return data;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }
}