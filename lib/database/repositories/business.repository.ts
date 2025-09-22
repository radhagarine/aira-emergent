// lib/database/repositories/business.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IBusinessRepository } from '@/lib/database/interfaces/business.interface';
import { 
  BusinessV2Row,
  BusinessV2Insert,
  BusinessV2Update,
  BusinessType,
  BusinessWithDetails,
  BusinessFileType
} from '@/lib/types/database/business.types'
import { DatabaseError } from '@/lib/types/shared/error.types';

export class BusinessRepository implements IBusinessRepository {
  private readonly tableName = 'business_v2';
  
  private readonly detailsQuery = `
    *,
    restaurant_details_v2(*),
    retail_details_v2(*),
    service_details_v2(*)
  `;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly factory: RepositoryFactory,
    private readonly config?: { testExistsOverride?: boolean }
  ) {}

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getFactory(): RepositoryFactory {
    return this.factory;
  }

  async getBusinessesByUserId(userId: string): Promise<BusinessV2Row[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get businesses for user ${userId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get businesses',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getBusinessesWithDetails(userId: string): Promise<BusinessWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.detailsQuery)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get businesses with details for user ${userId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get businesses with details',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getBusinessById(id: string): Promise<BusinessV2Row | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to get business ${id}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get business',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getBusinessWithDetails(id: string): Promise<BusinessWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.detailsQuery)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to get business with details ${id}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get business with details',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async createBusiness(data: BusinessV2Insert): Promise<BusinessV2Row> {
    try {
      // Check if profile_image is a File object
      let profileImageUrl: string | undefined;
      if (data.profile_image instanceof File) {
          const fileStorageRepo = this.factory.getFileStorageRepository();
          const uploadResult = await fileStorageRepo.uploadFile(
              data.profile_image, 
              data.user_id, 
              BusinessFileType.ProfileImage
          );
          profileImageUrl = uploadResult.publicUrl;
      }
      
      // Prepare business data for insertion
      const businessData: BusinessV2Insert = {
        ...data,
        profile_image: profileImageUrl || data.profile_image
    };

      const { data: newBusiness, error } = await this.supabase
        .from(this.tableName)
        .insert([{
          ...businessData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // If image was uploaded, delete it if business creation fails
        if (profileImageUrl) {
          const fileStorageRepo = this.factory.getFileStorageRepository();
          await fileStorageRepo.deleteFile(profileImageUrl);
        }
        throw new DatabaseError(
          'Failed to create business',
          error.code,
          error.message
        );
      }

      if (!newBusiness) {
        throw new DatabaseError(
          'Failed to create business',
          'INSERT_ERROR',
          'No data returned after insert'
        );
      }

      return newBusiness;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to create business',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async updateBusiness(
    id: string, 
    data: BusinessV2Update
  ): Promise<BusinessWithDetails> {
    try {
        // Get current business to handle existing profile image
        const currentBusiness = await this.getBusinessById(id);
        
        // Check if profile_image is a File object
        let profileImageUrl: string | undefined;
        if (data.profile_image instanceof File) {
            const fileStorageRepo = this.factory.getFileStorageRepository();
            
            // Delete existing profile image if it exists
            if (currentBusiness?.profile_image) {
                await fileStorageRepo.deleteFile(currentBusiness.profile_image);
            }

            // Upload new profile image
            const uploadResult = await fileStorageRepo.uploadFile(
                data.profile_image, 
                id, 
                BusinessFileType.ProfileImage
            );
            profileImageUrl = uploadResult.publicUrl;
        }

        // Prepare update data
        const updateData: BusinessV2Update = {
            ...data,
            profile_image: profileImageUrl || data.profile_image
        };

        // Update business record
        const { data: updatedBusiness, error } = await this.supabase
            .from(this.tableName)
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(this.detailsQuery)
            .single();

        if (error) {
            // Rollback file upload if update fails
            if (profileImageUrl) {
                const fileStorageRepo = this.factory.getFileStorageRepository();
                await fileStorageRepo.deleteFile(profileImageUrl);
            }
            throw new DatabaseError(
                `Failed to update business ${id}`,
                error.code,
                error.message
            );
        }

        return updatedBusiness;
    } catch (error) {
        if (error instanceof DatabaseError) throw error;
        throw new DatabaseError(
            'Failed to update business',
            'UNKNOWN_ERROR',
            error instanceof Error ? error.message : 'Unknown error occurred'
        );
    }
}

  async deleteBusiness(id: string): Promise<void> {
    try {
      const exists = await this.exists(id);
      if (!exists) {
        throw new DatabaseError(
          `Business ${id} not found`,
          'NOT_FOUND',
          'Business does not exist'
        );
      }

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete business ${id}`,
          error.code,
          error.message
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to delete business',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getBusinessesByType(type: BusinessType): Promise<BusinessWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.detailsQuery)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get businesses of type ${type}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get businesses by type',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      // If test configuration provides an override, use it
      if (this.config?.testExistsOverride !== undefined) {
        return this.config.testExistsOverride;
      }

      const { count } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to check business existence',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}