import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';
import { IFileStorageRepository } from '../interfaces/file-storage.interface';
import { BusinessFileType } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

export class FileStorageRepository implements IFileStorageRepository {
  private readonly storageBucket = 'business-files';

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
  
  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeInMB: number = 10): void {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new DatabaseError(
        `File size exceeds ${maxSizeInMB}MB limit`,
        'FILE_SIZE_EXCEEDED',
        `Maximum file size is ${maxSizeInMB}MB`
      );
    }

    // Optionally add more validations like file type, etc.
  }

  /**
   * Upload file to object storage
   */
  async uploadFile(
    file: File, 
    businessId: string, 
    fileType: BusinessFileType,
    onProgress?: (progress: number) => void
  ): Promise<{ storagePath: string; publicUrl: string }> {
    try {
      // 1. Get current authenticated user
    /* const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // 2. Verify business ownership
    const { data: business, error: businessError } = await this.supabase
      .from('business_v2')
      .select('user_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business || business.user_id !== user.id) {
      throw new Error('Unauthorized: Business does not belong to current user');
    } */

      // Validate file first
      this.validateFile(file);
  
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const storagePath = `${businessId}/${fileType}/${Date.now()}.${fileExt}`;
  
      console.log(`Attempting upload to path: ${storagePath}`);
      console.log(`Bucket name: ${this.storageBucket}`);
      console.log(`File type: ${file.type}`);
      console.log(`File size: ${file.size} bytes`);
      
      // Upload to storage
      const { data, error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type
        });
  
      if (uploadError) {
        console.error('Upload error details:', {
          error: uploadError,
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack
        });
        
        throw new DatabaseError(
          'File upload failed', 
          'STORAGE_UPLOAD_ERROR', 
          uploadError.message
        );
      }
  
      console.log('Upload successful, data:', data);
      
      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storagePath);
  
      return {
        storagePath,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('Caught error in uploadFile:', error);
      if (error instanceof DatabaseError) throw error;
      
      throw new DatabaseError(
        'File upload failed',
        'UPLOAD_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Delete file from object storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.storageBucket)
        .remove([storagePath]);

      if (error) {
        throw new DatabaseError(
          'File deletion failed', 
          'FILE_STORAGE_DELETE_ERROR',
          error.message
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      
      throw new DatabaseError(
        'File deletion failed',
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }
}