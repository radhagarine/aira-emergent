// lib/database/repositories/restaurant-details.repository.ts
import { BaseDetailsRepository } from './base-details.repository';
import { IRestaurantDetailsRepository } from '../interfaces/restaurant-details.interface';
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { DatabaseError } from '@/lib/types/shared/error.types';
import {
    RestaurantDetailsV2Row,
    RestaurantDetailsV2Insert,
    RestaurantDetailsV2Update
} from '@/lib/types/database/business.types';

export class RestaurantDetailsRepository
    extends BaseDetailsRepository
    implements IRestaurantDetailsRepository {

    constructor(
        supabase: SupabaseClient,
        factory: RepositoryFactory
    ) {
        super(supabase, factory, 'restaurant_details_v2', 'restaurant');
    }

    async getByBusinessId(businessId: string): Promise<RestaurantDetailsV2Row | null> {
        try {
            await this.validateBusiness(businessId);

            const { data, error } = await this.getClient()
                .from(this.tableName)
                .select('*')
                .eq('business_id', businessId)
                .single();

            // Use a more explicit check for 'No rows returned' error
            if (error) {
                // Postgrest returns 'PGRST116' when no rows match the query
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new DatabaseError(
                    `Failed to get restaurant details for business ${businessId}`,
                    typeof error.code === 'string' ? error.code : 'UNKNOWN_ERROR',
                    typeof error.message === 'string' ? error.message : String(error)
                );
            }

            return data;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            const errorMessage = "Failed to get restaurant details";
            throw new DatabaseError(
                errorMessage,
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : String(error)
            );
        }
    }

    async create(data: RestaurantDetailsV2Insert): Promise<RestaurantDetailsV2Row> {
        try {
            if (!data.business_id || data.business_id.trim() === '') {
                throw new DatabaseError(
                    'Invalid business ID',
                    'VALIDATION_ERROR',
                    'Business ID cannot be empty'
                );
            }

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
                    error.code || 'INSERT_ERROR',
                    error.message || 'Database insertion error'
                );
            }

            if (!newDetails) {
                throw new DatabaseError(
                    'Failed to create restaurant details',
                    'INSERT_ERROR',
                    'No data returned after insert'
                );
            }

            return newDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to create restaurant details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async update(id: string, data: RestaurantDetailsV2Update): Promise<RestaurantDetailsV2Row> {
        try {
            const currentDetails = await this.getDetailsById(id);
            if (!currentDetails) {
                throw new DatabaseError(
                    `Restaurant details ${id} not found`,
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
                    `Failed to update restaurant details ${id}`,
                    error.code,
                    error.message
                );
            }

            return updatedDetails;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to update restaurant details',
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
                    `Restaurant details ${id} not found`,
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
                    `Failed to delete restaurant details ${id}`,
                    error.code,
                    error.message
                );
            }
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to delete restaurant details',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }
}