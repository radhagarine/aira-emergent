// lib/database/repositories/businessfiles.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IBusinessFilesRepository } from '../interfaces/businessfiles.interface';
import { IFileStorageRepository } from '../interfaces/file-storage.interface';
import {
  BusinessFileV2Row,
  BusinessFileV2Insert,
  BusinessFileV2Update,
  BusinessFileType
} from '@/lib/types/database/business.types';
import { CreateFileParams, UpdateFileParams } from '@/lib/types/repository/file.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

export class BusinessFilesRepository implements IBusinessFilesRepository {
  private readonly tableName = 'business_files_v2';
  private fileStorageRepo: IFileStorageRepository;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly factory: RepositoryFactory
  ) {
    this.fileStorageRepo = this.factory.getFileStorageRepository();
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getFactory(): RepositoryFactory {
    return this.factory;
  }

  async getFilesByBusinessId(businessId: string): Promise<BusinessFileV2Row[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get files for business ${businessId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get files',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getFileById(id: string): Promise<BusinessFileV2Row | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to get file ${id}`,
          error.code,
          error.message
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get file',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async createFile(params: CreateFileParams): Promise<BusinessFileV2Row> {
    let storagePath: string | null = null;
    try {

      // Log auth state at repository level
      const { data: { user } } = await this.supabase.auth.getUser();
      console.log('[BusinessFilesRepository] Auth user in repo:', user?.id);
      console.log('[BusinessFilesRepository] JWT token available:', !!this.supabase.auth.getSession());
      
      // 1. Upload file to storage
      const uploadResult = await this.fileStorageRepo.uploadFile(
        params.file,
        params.business_id,
        params.file_type
      );
      storagePath = uploadResult.storagePath;

      // 2. Create database record
      const fileData: BusinessFileV2Insert = {
        business_id: params.business_id,
        file_type: params.file_type,
        original_name: params.original_name,
        storage_path: storagePath,
        file_size: params.file.size,
        mime_type: params.file.type,
        metadata: params.metadata || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newFile, error } = await this.supabase
        .from(this.tableName)
        .insert([fileData])
        .select()
        .single();

      if (error) {
        // Rollback: Delete uploaded file if database insert fails
        if (storagePath) {
          await this.fileStorageRepo.deleteFile(storagePath);
        }
        throw new DatabaseError(
          error.message || 'Failed to create file record',
          error.code || 'CREATE_ERROR',
          error.details
        );
      }

      return newFile;
    } catch (error) {
      // If the file was uploaded but not recorded, delete from storage
      if (storagePath) {
        try {
          await this.fileStorageRepo.deleteFile(storagePath);
        } catch (deleteError) {
          console.error('Failed to delete uploaded file:', deleteError);
        }
      }

      if (error instanceof DatabaseError) throw error;

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to create file record',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  async updateFile(id: string, params: UpdateFileParams): Promise<BusinessFileV2Row> {
    let oldStoragePath: string | null = null;
    let newStoragePath: string | null = null;

    try {
      const existingFile = await this.getFileById(id);
      if (!existingFile) {
        throw new DatabaseError(
          `File ${id} not found`,
          'NOT_FOUND',
          'File does not exist'
        );
      }

      const updateData: BusinessFileV2Update = {
        updated_at: new Date().toISOString()
      };

      // Handle file update if new file is provided
      if (params.file) {
        const uploadResult = await this.fileStorageRepo.uploadFile(
          params.file,
          existingFile.business_id,
          existingFile.file_type as BusinessFileType
        );

        oldStoragePath = existingFile.storage_path;
        newStoragePath = uploadResult.storagePath;

        updateData.storage_path = newStoragePath;
        updateData.file_size = params.file.size;
        updateData.mime_type = params.file.type;
      }

      // Update metadata if provided
      if (params.metadata !== undefined) {
        updateData.metadata = params.metadata;
      }

      // Update original name if provided
      if (params.original_name !== undefined) {
        updateData.original_name = params.original_name;
      }

      // Update database record
      const { data: updatedFile, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // If we uploaded a new file but failed to update DB, delete the new file
        if (newStoragePath) {
          await this.fileStorageRepo.deleteFile(newStoragePath);
        }
        throw new DatabaseError(
          error.message || `Failed to update file ${id}`,
          error.code || 'UPDATE_ERROR',
          error.details
        );
      }

      // If update was successful and we replaced the file, delete the old one
      if (oldStoragePath && newStoragePath) {
        try {
          await this.fileStorageRepo.deleteFile(oldStoragePath);
        } catch (deleteError) {
          console.error('Failed to delete old file:', deleteError);
        }
      }

      return updatedFile;
    } catch (error) {
      // Clean up any newly uploaded file if an error occurred
      if (newStoragePath) {
        try {
          await this.fileStorageRepo.deleteFile(newStoragePath);
        } catch (deleteError) {
          console.error('Failed to delete newly uploaded file:', deleteError);
        }
      }

      if (error instanceof DatabaseError) throw error;

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to update file',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  async deleteFile(id: string): Promise<void> {
    let storagePath: string | null = null;
    try {
      const file = await this.getFileById(id);
      if (!file) {
        throw new DatabaseError(
          `File ${id} not found`,
          'NOT_FOUND',
          'File does not exist'
        );
      }

      storagePath = file.storage_path;

      // Delete from storage first
      await this.fileStorageRepo.deleteFile(storagePath);

      // Delete database record
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        // If DB deletion fails, attempt to restore storage file
        try {
          await this.fileStorageRepo.uploadFile(
            new File([], file.original_name),
            file.business_id,
            file.file_type as BusinessFileType
          );
        } catch (restoreError) {
          console.error('Failed to restore deleted file:', restoreError);
        }

        throw new DatabaseError(
          error.message || `Failed to delete file record ${id}`,
          error.code || 'DELETE_ERROR',
          error.details
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;

      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to delete file',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  async getFilesByType(businessId: string, fileType: BusinessFileType): Promise<BusinessFileV2Row[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .eq('file_type', fileType)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to get files of type ${fileType} for business ${businessId}`,
          error.code,
          error.message
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'Failed to get files by type',
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
 * Get a file by its original name
 * @param businessId - ID of the business
 * @param originalName - Original name of the file
 */
  async getFileByOriginalName(
    businessId: string,
    originalName: string
  ): Promise<BusinessFileV2Row | null> {
    try {
      console.log(`[BusinessFilesRepository] Getting file by original name: ${originalName} for business: ${businessId}`);

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .eq('original_name', originalName)
        .limit(1)
        .single();

      if (error) {
        // If file not found, return null
        if (error.code === 'PGRST116') {
          console.log(`[BusinessFilesRepository] No file found with name: ${originalName}`);
          return null;
        }

        throw new DatabaseError(
          `Failed to get file with name ${originalName}`,
          error.code,
          error.message
        );
      }

      console.log(`[BusinessFilesRepository] Found file with name: ${originalName}`, data);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;

      throw new DatabaseError(
        `Failed to get file by name ${originalName}`,
        'QUERY_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Delete a file by its original name
   * @param businessId - ID of the business
   * @param originalName - Original name of the file
   */
  async deleteFileByOriginalName(
    businessId: string,
    originalName: string
  ): Promise<void> {
    try {
      console.log(`[BusinessFilesRepository] Deleting file by original name: ${originalName} for business: ${businessId}`);

      // First get the file to get its ID and storage path
      const file = await this.getFileByOriginalName(businessId, originalName);

      if (!file) {
        throw new DatabaseError(
          `File with name ${originalName} not found`,
          'NOT_FOUND',
          'File does not exist'
        );
      }

      // Now delete using the regular delete method
      await this.deleteFile(file.id);
      console.log(`[BusinessFilesRepository] Deleted file with name: ${originalName}`);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;

      throw new DatabaseError(
        `Failed to delete file by name ${originalName}`,
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

}