// lib/database/repositories/appointments.repository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IAppointmentsRepository } from '../interfaces/appointments.interface';
import { DatabaseError } from '@/lib/types/shared/error.types';
import {
    AppointmentV2Row,
    AppointmentV2Insert,
    AppointmentV2Update,
    AppointmentStatus
} from '@/lib/types/database/business.types';

export class AppointmentsRepository implements IAppointmentsRepository {
    private readonly tableName = 'appointments_v2';
    private _testMode = false; // Add testMode flag

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

    // Add method to set test mode
    _setTestMode(testMode: boolean): void {
        this._testMode = testMode;
    }

    async getByBusinessId(
        businessId: string,
        dateRange?: { start: Date; end: Date }
    ): Promise<AppointmentV2Row[]> {
        try {
            // First, verify the business exists
            const businessRepo = this.factory.getBusinessRepository();
            const exists = await businessRepo.exists(businessId);
            
            if (!exists) {
                throw new DatabaseError(
                    `Business ${businessId} not found`,
                    'NOT_FOUND',
                    'Business does not exist'
                );
            }

            let query = this.supabase
                .from(this.tableName)
                .select('*')
                .eq('business_id', businessId)
                .order('start_time', { ascending: true });

            // Add date range filter if provided
            if (dateRange) {
                query = query
                    .gte('start_time', dateRange.start.toISOString())
                    .lte('end_time', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                throw new DatabaseError(
                    `Failed to get appointments for business ${businessId}`,
                    error.code,
                    error.message
                );
            }

            return data || [];
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get appointments',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async getById(id: string): Promise<AppointmentV2Row | null> {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw new DatabaseError(
                    `Failed to get appointment ${id}`,
                    error.code,
                    error.message
                );
            }

            return data;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get appointment',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async create(data: AppointmentV2Insert): Promise<AppointmentV2Row> {
        try {
            // Validate business exists
            const businessRepo = this.factory.getBusinessRepository();
            const exists = await businessRepo.exists(data.business_id);
            
            if (!exists) {
                throw new DatabaseError(
                    `Business ${data.business_id} not found`,
                    'NOT_FOUND',
                    'Business does not exist'
                );
            }

            // Validate appointment times - pass testMode flag
            this.validateAppointmentTimes(
                new Date(data.start_time), 
                new Date(data.end_time)
            );

            // Check for overlapping appointments
            const hasOverlap = await this.checkOverlappingAppointments(
                data.business_id,
                new Date(data.start_time),
                new Date(data.end_time)
            );

            if (hasOverlap) {
                throw new DatabaseError(
                    'Appointment time slot is not available',
                    'OVERLAP_ERROR',
                    'The requested time slot overlaps with existing appointments'
                );
            }

            const { data: newAppointment, error } = await this.supabase
                .from(this.tableName)
                .insert([{
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: data.status || 'pending'
                }])
                .select()
                .single();

            if (error) {
                throw new DatabaseError(
                    'Failed to create appointment',
                    error.code,
                    error.message
                );
            }

            if (!newAppointment) {
                throw new DatabaseError(
                    'Failed to create appointment',
                    'INSERT_ERROR',
                    'No data returned after insert'
                );
            }

            return newAppointment;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to create appointment',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async update(id: string, data: AppointmentV2Update): Promise<AppointmentV2Row> {
        try {
            const currentAppointment = await this.getById(id);
            if (!currentAppointment) {
                throw new DatabaseError(
                    `Appointment ${id} not found`,
                    'NOT_FOUND',
                    'Appointment does not exist'
                );
            }

            // If updating times, validate them
            if (data.start_time || data.end_time) {
                const startTime = new Date(data.start_time || currentAppointment.start_time);
                const endTime = new Date(data.end_time || currentAppointment.end_time);
                
                this.validateAppointmentTimes(startTime, endTime);

                // Check for overlapping appointments (excluding current appointment)
                const hasOverlap = await this.checkOverlappingAppointments(
                    currentAppointment.business_id,
                    startTime,
                    endTime,
                    id
                );

                if (hasOverlap) {
                    throw new DatabaseError(
                        'Appointment time slot is not available',
                        'OVERLAP_ERROR',
                        'The requested time slot overlaps with existing appointments'
                    );
                }
            }

            const { data: updatedAppointment, error } = await this.supabase
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
                    `Failed to update appointment ${id}`,
                    error.code,
                    error.message
                );
            }

            return updatedAppointment;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to update appointment',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const currentAppointment = await this.getById(id);
            if (!currentAppointment) {
                throw new DatabaseError(
                    `Appointment ${id} not found`,
                    'NOT_FOUND',
                    'Appointment does not exist'
                );
            }

            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                throw new DatabaseError(
                    `Failed to delete appointment ${id}`,
                    error.code,
                    error.message
                );
            }
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to delete appointment',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    async getByStatus(
        businessId: string,
        status: AppointmentStatus,
        dateRange?: { start: Date; end: Date }
    ): Promise<AppointmentV2Row[]> {
        try {
            let query = this.supabase
                .from(this.tableName)
                .select('*')
                .eq('business_id', businessId)
                .eq('status', status)
                .order('start_time', { ascending: true });

            // Add date range filter if provided
            if (dateRange) {
                query = query
                    .gte('start_time', dateRange.start.toISOString())
                    .lte('end_time', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                throw new DatabaseError(
                    `Failed to get appointments with status ${status}`,
                    error.code,
                    error.message
                );
            }

            return data || [];
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to get appointments by status',
                'UNKNOWN_ERROR',
                error instanceof Error ? error.message : 'Unknown error occurred'
            );
        }
    }

    /**
   * Check if a time slot is available (no overlapping appointments)
   * This is a complex business rule that is probably better handled in the service layer,
   * but we'll implement a basic version here and then extend it in the service.
   */
  async isTimeSlotAvailable(
    businessId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      // We only care about appointments that might overlap with our time slot
      // So we get all appointments that:
      // 1. Start before the given end time AND
      // 2. End after the given start time
      // This covers all possible overlaps
      
      let query = this.supabase
        .from(this.tableName)
        .select('id')
        .eq('business_id', businessId)
        // Only consider confirmed and pending appointments
        .in('status', ['confirmed', 'pending'])
        // Appointment starts before our end time
        .lt('start_time', endTime.toISOString())
        // Appointment ends after our start time
        .gt('end_time', startTime.toISOString());

      // Exclude the appointment we're updating if ID is provided
      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      // Get overlapping appointments (without using count)
      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          'Failed to check time slot availability',
          error.code,
          error.message
        );
      }

      // If there are no overlapping appointments, the time slot is available
      return data.length === 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      
      throw new DatabaseError(
        'Failed to check time slot availability',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

    private validateAppointmentTimes(startTime: Date, endTime: Date): void {
        // Ensure dates are valid
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new DatabaseError(
                'Invalid appointment times',
                'INVALID_TIME',
                'Start time or end time is invalid'
            );
        }

        // Ensure start is before end
        if (startTime >= endTime) {
            throw new DatabaseError(
                'Invalid appointment duration',
                'INVALID_DURATION',
                'Start time must be before end time'
            );
        }

        // All other complex validation like business hours, past dates, etc.
        // is handled by the LLM agent during the customer interaction
        // We only focus on basic data integrity here
    }

    private async checkOverlappingAppointments(
        businessId: string, 
        startTime: Date, 
        endTime: Date,
        excludeId?: string
    ): Promise<boolean> {
        try {
            let query = this.supabase
                .from(this.tableName)
                .select('id')
                .eq('business_id', businessId)
                .lt('start_time', endTime.toISOString())
                .gt('end_time', startTime.toISOString());

            // Exclude current appointment if updating
            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query;

            if (error) {
                throw new DatabaseError(
                    'Failed to check overlapping appointments',
                    error.code,
                    error.message
                );
            }

            return (data?.length || 0) > 0;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError(
                'Failed to check appointment overlap',
                'OVERLAP_CHECK_ERROR',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }
}