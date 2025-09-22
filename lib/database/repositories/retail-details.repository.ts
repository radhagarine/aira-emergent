// lib/database/repositories/retail-details.repository.ts
import { BaseDetailsRepository } from '@/lib/database/repositories/base-details.repository';
import { IRetailDetailsRepository } from '@/lib/database/interfaces/retail-details.interface';
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { DatabaseError } from '@/lib/types/shared/error.types';
import {
    RetailDetailsV2Row,
    RetailDetailsV2Insert,
    RetailDetailsV2Update
} from '@/lib/types/database/business.types';

export class RetailDetailsRepository 
    extends BaseDetailsRepository 
    implements IRetailDetailsRepository {
    
    constructor(
        supabase: SupabaseClient,
        factory: RepositoryFactory
    ) {
        super(supabase, factory, 'retail_details_v2', 'retail');
    }

    async getByBusinessId(businessId: string): Promise<RetailDetailsV2Row | null> {
        try {
            await this.validateBusiness(businessId);

            const { data, error } = await this.getClient()
                .from(this.tableName)
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new DatabaseError(
                    `Failed to get retail details for business ${businessId}`,
                    error.code,
                    error.message
                );
            }

            return data;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get retail details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async create(data: RetailDetailsV2Insert): Promise<RetailDetailsV2Row> {
        try {
            await this.validateBusiness(data.business_id);

            const { data: newDetails, error } = await this.getClient()
                .from(this.tableName)
                .insert([{
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                throw new DatabaseError(
                    'Failed to create retail details',
                    error.code,
                    error.message
                );
            }

            if (!newDetails) {
                throw new DatabaseError(
                    'Failed to create retail details',
                    'INSERT_ERROR',
                    'No data returned after insert'
                );
            }

            return newDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to create retail details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async update(id: string, data: RetailDetailsV2Update): Promise<RetailDetailsV2Row> {
        try {
            const currentDetails = await this.getDetailsById(id);
            if (!currentDetails) {
                throw new DatabaseError(
                    `Retail details ${id} not found`,
                    'NOT_FOUND',
                    'Details do not exist'
                );
            }

            await this.validateBusiness(currentDetails.business_id);

            const { data: updatedDetails, error } = await this.getClient()
                .from(this.tableName)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new DatabaseError(
                    `Failed to update retail details ${id}`,
                    error.code,
                    error.message
                );
            }

            return updatedDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to update retail details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const currentDetails = await this.getDetailsById(id);
            if (!currentDetails) {
                throw new DatabaseError(
                    `Retail details ${id} not found`,
                    'NOT_FOUND',
                    'Details do not exist'
                );
            }

            await this.validateBusiness(currentDetails.business_id);

            const { error } = await this.getClient()
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                throw new DatabaseError(
                    `Failed to delete retail details ${id}`,
                    error.code,
                    error.message
                );
            }
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to delete retail details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }
}