import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '@/lib/database/repository.factory'
import { BusinessFileType } from '@/lib/types/database/business.types';
import { IRepository } from '@/lib/database/interfaces/base.repository'

export interface IFileStorageRepository extends IRepository{
  /**
   * Upload a file to object storage
   */
  uploadFile(
    file: File, 
    businessId: string, 
    fileType: BusinessFileType,
    onProgress?: (progress: number) => void
  ): Promise<{
    storagePath: string;
    publicUrl: string;
  }>;

  /**
   * Delete a file from object storage
   */
  deleteFile(storagePath: string): Promise<void>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(storagePath: string): string;

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeInMB?: number): void;
}