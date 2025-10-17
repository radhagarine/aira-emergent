// src/lib/services/file/file.service.ts
import {
  IFileService,
  FileUploadResponse,
  FileMetadata,
  KnowledgeBaseFile
} from '@/lib/services/file/types';
import { getRepositoryFactory, RepositoryFactory } from '@/lib/database/repository.factory';
import { BusinessFileType } from '@/lib/types/database/business.types';
import { DatabaseError, ServiceError } from '@/lib/types/shared/error.types';
import { CacheManager } from '../common/cache-manager';

/**
 * File Service for handling all file operations
 * This service provides an abstraction over the repository layer
 * and contains business logic for file operations
 */
export class FileService implements IFileService {
  private repositoryFactory;
  private businessFilesRepository;
  private fileStorageRepository;
  private cacheManager: CacheManager;

  constructor(repoFactoryOverride?: RepositoryFactory) {
    this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
    this.businessFilesRepository = this.repositoryFactory.getBusinessFilesRepository();
    this.fileStorageRepository = this.repositoryFactory.getFileStorageRepository();
    this.cacheManager = new CacheManager();
  }

  /**
   * Upload a file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param fileType - Type of file being uploaded
   * @param metadata - Optional metadata for the file
   * @param onProgress - Optional progress callback
   */
  // Modified uploadFile method for FileService class

  async uploadFile(
    businessId: string,
    file: File,
    fileType: BusinessFileType,
    metadata?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    try {
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }

      // Validate file
      if (!file) {
        throw ServiceError.create(
          'No file provided',
          'VALIDATION_ERROR',
          'A valid file must be provided'
        );
      }

      // Validate file type
      const validFileTypes = Object.values(BusinessFileType);
      if (!validFileTypes.includes(fileType)) {
        throw ServiceError.create(
          `Invalid file type: ${fileType}`,
          'VALIDATION_ERROR',
          `File type must be one of: ${validFileTypes.join(', ')}`
        );
      }

      // Additional file type specific validation
      this.validateFileByType(file, fileType);

      // Check if a file with the same name already exists for this business
      const existingFile = await this.businessFilesRepository.getFileByOriginalName(
        businessId,
        file.name
      );

      if (existingFile) {
        // File with same name already exists - update it instead of creating a new one

        // Return a notification about the update in the metadata
        const updatedMetadata = {
          ...(metadata || {}),
          lastModified: file.lastModified,
          contentType: file.type,
          isUpdate: true,
          previousVersion: {
            id: existingFile.id,
            uploadDate: existingFile.created_at,
            size: existingFile.file_size
          }
        };

        const updatedFile = await this.businessFilesRepository.updateFile(existingFile.id, {
          file: file,
          metadata: updatedMetadata
        });

        // Convert metadata to Record<string, any> | null if it exists
        const convertedMetadata = updatedFile.metadata ?
          (typeof updatedFile.metadata === 'string' ?
            JSON.parse(updatedFile.metadata) : updatedFile.metadata) : null;

        // Get URL for the updated file
        const url = this.fileStorageRepository.getPublicUrl(updatedFile.storage_path);

        // Invalidate cache for this business's files
        this.cacheManager.clearByPrefix(`files:${businessId}`);

        return {
          id: updatedFile.id,
          name: updatedFile.original_name,
          size: updatedFile.file_size,
          type: updatedFile.mime_type,
          url,
          metadata: convertedMetadata,
          uploadDate: updatedFile.updated_at
        };
      }

      // If we reach here, no file with this name exists, proceed with normal upload

      // Upload file to storage
      const uploadResult = await this.fileStorageRepository.uploadFile(
        file,
        businessId,
        fileType,
        onProgress
      );

      // Create file record in database
      const fileRecord = await this.businessFilesRepository.createFile({
        business_id: businessId,
        file_type: fileType,
        original_name: file.name,
        file: file,
        metadata: metadata || {
          lastModified: file.lastModified,
          contentType: file.type
        }
      });

      // Convert metadata to Record<string, any> | null if it exists
      const convertedMetadata = fileRecord.metadata ?
        (typeof fileRecord.metadata === 'string' ?
          JSON.parse(fileRecord.metadata) : fileRecord.metadata) : null;

      // Invalidate cache for this business's files
      this.cacheManager.clearByPrefix(`files:${businessId}`);

      return {
        id: fileRecord.id,
        name: fileRecord.original_name,
        size: fileRecord.file_size,
        type: fileRecord.mime_type,
        url: uploadResult.publicUrl,
        metadata: convertedMetadata,
        uploadDate: fileRecord.created_at
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to upload file',
        'UPLOAD_ERROR',
        error
      );
    }
  }

  /**
   * Get all files for a business
   * @param businessId - ID of the business
   */
  async getBusinessFiles(businessId: string): Promise<FileMetadata[]> {
    try {
      // Try to get from cache first
      const cacheKey = `files:${businessId}:all`;
      const cachedFiles = this.cacheManager.get<FileMetadata[]>(cacheKey);
      if (cachedFiles) {
        return cachedFiles;
      }

      const files = await this.businessFilesRepository.getFilesByBusinessId(businessId);

      const result = files.map(file => {
        // Convert metadata to Record<string, any> | null if it exists
        const convertedMetadata = file.metadata ?
          (typeof file.metadata === 'string' ?
            JSON.parse(file.metadata) : file.metadata) : null;

        // Get URL synchronously (this needs to be a string, not a Promise)
        const url = this.fileStorageRepository.getPublicUrl(file.storage_path);

        return {
          id: file.id,
          name: file.original_name,
          size: file.file_size,
          type: file.mime_type,
          url, // String, not Promise
          metadata: convertedMetadata,
          uploadDate: file.created_at,
          fileType: file.file_type as BusinessFileType
        };
      });

      // Store in cache
      this.cacheManager.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to get business files',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Get files by type for a business
   * @param businessId - ID of the business
   * @param fileType - Type of files to retrieve
   */
  async getFilesByType(
    businessId: string,
    fileType: BusinessFileType
  ): Promise<FileMetadata[]> {
    try {
      // Try to get from cache first
      const cacheKey = `files:${businessId}:${fileType}`;
      const cachedFiles = this.cacheManager.get<FileMetadata[]>(cacheKey);
      if (cachedFiles) {
        return cachedFiles;
      }

      const files = await this.businessFilesRepository.getFilesByType(businessId, fileType);

      const result = files.map(file => {
        // Convert metadata to Record<string, any> | null if it exists
        const convertedMetadata = file.metadata ?
          (typeof file.metadata === 'string' ?
            JSON.parse(file.metadata) : file.metadata) : null;

        // Get URL synchronously (this needs to be a string, not a Promise)
        const url = this.fileStorageRepository.getPublicUrl(file.storage_path);

        return {
          id: file.id,
          name: file.original_name,
          size: file.file_size,
          type: file.mime_type,
          url, // String, not Promise
          metadata: convertedMetadata,
          uploadDate: file.created_at,
          fileType: file.file_type as BusinessFileType
        };
      });

      // Store in cache
      this.cacheManager.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to get files by type',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
 * Delete a file by ID or name
 * @param fileIdOrName - ID or name of the file to delete
 * @param businessId - Optional business ID (required when using file name)
 */
  async deleteFile(fileIdOrName: string, businessId?: string): Promise<void> {
    try {

      if (!fileIdOrName) {
        throw ServiceError.create(
          'File identifier is required',
          'VALIDATION_ERROR',
          'A valid file ID or name must be provided'
        );
      }

      // Check if we're dealing with a filename (contains dot) or ID
      if (fileIdOrName.includes('.')) {
        // This appears to be a filename

        if (!businessId) {
          throw ServiceError.create(
            'Business ID is required when deleting by filename',
            'VALIDATION_ERROR',
            'When deleting a file by name, you must provide a business ID'
          );
        }

        // Use the new repository method to delete by name
        await this.businessFilesRepository.deleteFileByOriginalName(businessId, fileIdOrName);
        // Invalidate caches
        this.cacheManager.clearByPrefix(`files:${businessId}`);
      } else {
        // This appears to be a file ID

        // Get the file first to obtain the businessId
        const file = await this.businessFilesRepository.getFileById(fileIdOrName);
        if (!file) {
          throw ServiceError.create(
            `File with ID ${fileIdOrName} not found`,
            'NOT_FOUND',
            'File does not exist'
          );
        }

        // Store businessId for cache invalidation
        const fileBusiness = file.business_id;

        // Delete the file
        await this.businessFilesRepository.deleteFile(fileIdOrName);

        // Clear cache for the business
        if (fileBusiness) {
          this.cacheManager.clearByPrefix(`files:${fileBusiness}`);
        }
      }

    } catch (error) {
      console.error(`[FileService] Error deleting file:`, error);

      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }

      if (error instanceof ServiceError) {
        throw error;
      }

      throw ServiceError.create(
        'Failed to delete file',
        'DELETE_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Upload a knowledge base file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param onProgress - Optional progress callback
   */
  async uploadKnowledgeBaseFile(
    businessId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeBaseFile> {
    try {
      // Log auth state at service level
      const { data: { user } } = await this.repositoryFactory.getClient().auth.getUser();
      
  
      // Validate business ID
      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }
  
      // Validate file
      if (!file) {
        throw ServiceError.create(
          'No file provided',
          'VALIDATION_ERROR',
          'A valid file must be provided'
        );
      }
  
      // First validate the file to ensure it's a valid knowledge base file
      this.validateKnowledgeBaseFile(file);
  
      // Upload the file using the internal uploadFile method
      const result = await this.uploadFile(
        businessId,
        file,
        BusinessFileType.KnowledgeBase,
        {
          fileOrigin: 'knowledge-base-upload',
          uploadTimestamp: new Date().toISOString()
        },
        onProgress
      );
  
  
      // Check if this was an update or a new file
      const wasFileUpdated: boolean = result.metadata && result.metadata.isUpdate === true ? true : false;
  
      // Transform the result into a KnowledgeBaseFile
      const knowledgeBaseFile: KnowledgeBaseFile = {
        name: result.name,
        size: result.size,
        type: result.type,
        uploadDate: result.uploadDate,
        // Add new property to indicate this was an update
        wasUpdated: wasFileUpdated
      };
  
      return knowledgeBaseFile;
    } catch (error) {
      console.error(`[FileService] Error uploading knowledge base file:`, error);
  
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
  
      if (error instanceof ServiceError) {
        throw error;
      }
  
      throw ServiceError.create(
        'Failed to upload knowledge base file',
        'UPLOAD_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Upload a CSV configuration file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param onProgress - Optional progress callback
   */
  async uploadConfigFile(
    businessId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw ServiceError.create(
          'Invalid file type',
          'VALIDATION_ERROR',
          'Config file must be a CSV file'
        );
      }

      return await this.uploadFile(
        businessId,
        file,
        BusinessFileType.CSVConfig,
        undefined,
        onProgress
      );
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }
      throw ServiceError.create(
        'Failed to upload config file',
        'UPLOAD_ERROR',
        error
      );
    }
  }

  /**
   * Get all knowledge base files for a business
   * @param businessId - ID of the business
   */
  async getKnowledgeBaseFiles(businessId: string): Promise<KnowledgeBaseFile[]> {
    try {

      if (!businessId) {
        throw ServiceError.create(
          'Business ID is required',
          'VALIDATION_ERROR',
          'A valid business ID must be provided'
        );
      }
      // Try to get from cache first
      const cacheKey = `files:${businessId}:knowledge_base`;
      const cachedFiles = this.cacheManager.get<KnowledgeBaseFile[]>(cacheKey);
      if (cachedFiles) {
        return cachedFiles;
      }

      // Get files from repository
      const files = await this.businessFilesRepository.getFilesByType(
        businessId,
        BusinessFileType.KnowledgeBase
      );


      // Transform the repository result into KnowledgeBaseFiles
      const knowledgeBaseFiles = files.map(file => ({
        name: file.original_name,
        size: file.file_size,
        type: file.mime_type,
        uploadDate: file.created_at
      }));

      // Store in cache
      this.cacheManager.set(cacheKey, knowledgeBaseFiles);

      return knowledgeBaseFiles;
    } catch (error) {
      console.error(`[FileService] Error getting knowledge base files:`, error);

      if (error instanceof DatabaseError) {
        throw ServiceError.fromRepositoryError(error);
      }

      if (error instanceof ServiceError) {
        throw error;
      }
      throw ServiceError.create(
        'Failed to get knowledge base files',
        'FETCH_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private validateFileSizeByType(file: File, fileType: BusinessFileType): void {
    // Define size limits for different file types in MB
    let maxSizeInMB: number;
    
    // Set appropriate size limit based on file type
    switch (fileType) {
      case 'knowledge_base':
        maxSizeInMB = 10; // 10MB for knowledge base files
        break;
      case 'csv_config':
        maxSizeInMB = 5;  // 5MB for CSV config files
        break;
      case 'profile_image':
        maxSizeInMB = 5;  // 5MB for profile images
        break;
      default:
        maxSizeInMB = 10; // Default to 10MB for any other file types
    }
    
    // Convert MB to bytes
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    // Check if file size exceeds the limit
    if (file.size > maxSizeInBytes) {
      // Calculate file size in MB for readable error message
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      throw ServiceError.create(
        'File size exceeds limit',
        'VALIDATION_ERROR',
        `File must be smaller than ${maxSizeInMB}MB. Current size: ${fileSizeMB}MB`
      );
    }
  }
  

  /**
   * Validate file based on its type
   * @param file - File to validate
   * @param fileType - Type of file
   */
  private validateFileByType(file: File, fileType: BusinessFileType): void {
    // Base validation is always performed
    this.fileStorageRepository.validateFile(file);

    // Additional validations based on file type
    switch (fileType) {
      case BusinessFileType.KnowledgeBase:
        this.validateKnowledgeBaseFile(file);
        break;
      case BusinessFileType.CSVConfig:
        this.validateCSVFile(file);
        break;
      case BusinessFileType.ProfileImage:
        this.validateProfileImage(file);
        break;
      default:
        // No additional validation for other types
        break;
    }
  }

  /**
   * Validate knowledge base file
   * @param file - File to validate
   */
  private validateKnowledgeBaseFile(file: File): void {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw ServiceError.create(
        'Invalid file type for knowledge base',
        'VALIDATION_ERROR',
        'Knowledge base files must be PDF, DOC, DOCX, TXT, CSV, or JSON'
      );
    }
  }

  /**
   * Validate CSV file
   * @param file - File to validate
   */
  private validateCSVFile(file: File): void {
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      throw ServiceError.create(
        'Invalid file type for CSV configuration',
        'VALIDATION_ERROR',
        'Configuration file must be a CSV file'
      );
    }
  }

  /**
   * Validate profile image
   * @param file - File to validate
   */
  private validateProfileImage(file: File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw ServiceError.create(
        'Invalid file type for profile image',
        'VALIDATION_ERROR',
        'Profile image must be JPEG, PNG, GIF, or WEBP'
      );
    }

    // For profile images, enforce a smaller max size (5MB instead of the default 10MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      throw ServiceError.create(
        'File too large',
        'VALIDATION_ERROR',
        'Profile image must be smaller than 5MB'
      );
    }
  }
}

// Export a singleton instance
export const fileService = new FileService();