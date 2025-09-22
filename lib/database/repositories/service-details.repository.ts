// lib/database/repositories/service-details.repository.ts
import { BaseDetailsRepository } from './base-details.repository';
import { IServiceDetailsRepository } from '../interfaces/service-details.interface';
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { DatabaseError } from '@/lib/types/shared/error.types';
import {
    ServiceDetailsV2Row,
    ServiceDetailsV2Insert,
    ServiceDetailsV2Update
} from '@/lib/types/database/business.types';

export class ServiceDetailsRepository 
    extends BaseDetailsRepository 
    implements IServiceDetailsRepository {
    
    constructor(
        supabase: SupabaseClient,
        factory: RepositoryFactory
    ) {
        super(supabase, factory, 'service_details_v2', 'service');
    }

    async getByBusinessId(businessId: string): Promise<ServiceDetailsV2Row | null> {
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
                    `Failed to get service details for business ${businessId}`,
                    error.code,
                    error.message
                );
            }

            return data;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get service details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async create(data: ServiceDetailsV2Insert): Promise<ServiceDetailsV2Row> {
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
                    'Failed to create service details',
                    error.code,
                    error.message
                );
            }

            if (!newDetails) {
                throw new DatabaseError(
                    'Failed to create service details',
                    'INSERT_ERROR',
                    'No data returned after insert'
                );
            }

            return newDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to create service details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async update(id: string, data: ServiceDetailsV2Update): Promise<ServiceDetailsV2Row> {
        try {
            const currentDetails = await this.getDetailsById(id);
            if (!currentDetails) {
                throw new DatabaseError(
                    `Service details ${id} not found`,
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
                    `Failed to update service details ${id}`,
                    error.code,
                    error.message
                );
            }

            return updatedDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to update service details',
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
                    `Service details ${id} not found`,
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
                    `Failed to delete service details ${id}`,
                    error.code,
                    error.message
                );
            }
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to delete service details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }
}