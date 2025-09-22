// src/lib/services/file/types.ts
import { BusinessFileType } from '@/lib/types/database/business.types';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
  fileType: BusinessFileType;
  metadata?: Record<string, any> | null;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
  metadata?: Record<string, any> | null;
}

export interface KnowledgeBaseFile {
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  wasUpdated?: boolean;
}

export interface IFileService {
  /**
   * Get all files for a business
   * @param businessId - ID of the business
   */
  getBusinessFiles(businessId: string): Promise<FileMetadata[]>;
  
  /**
   * Get files by type for a business
   * @param businessId - ID of the business
   * @param fileType - Type of files to retrieve
   */
  getFilesByType(
    businessId: string, 
    fileType: BusinessFileType
  ): Promise<FileMetadata[]>;
  
  /**
   * Upload a file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param fileType - Type of file being uploaded
   * @param metadata - Optional metadata for the file
   * @param onProgress - Optional progress callback
   */
  uploadFile(
    businessId: string,
    file: File,
    fileType: BusinessFileType,
    metadata?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse>;
  
  /**
   * Delete a file
   * @param fileId - ID of the file to delete
   */
  deleteFile(fileIdOrName: string, businessId?: string): Promise<void>;
  
  /**
   * Upload a knowledge base file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param onProgress - Optional progress callback
   */
  uploadKnowledgeBaseFile(
    businessId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeBaseFile>;
  
  /**
   * Upload a CSV configuration file for a business
   * @param businessId - ID of the business
   * @param file - File to upload
   * @param onProgress - Optional progress callback
   */
  uploadConfigFile(
    businessId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse>;
  
  /**
   * Get all knowledge base files for a business
   * @param businessId - ID of the business
   */
  getKnowledgeBaseFiles(businessId: string): Promise<KnowledgeBaseFile[]>;
}