// Updated interface in businessfiles.interface.ts
import { 
  BusinessFileV2Row, 
  BusinessFileType 
} from '@/lib/types/database/business.types';
import { IRepository } from '@/lib/database/interfaces/base.repository';
import { CreateFileParams, UpdateFileParams } from '@/lib/types/repository/file.types';

export interface IBusinessFilesRepository extends IRepository {
  /**
   * Get all files for a business
   * @param businessId - ID of the business
   */
  getFilesByBusinessId(businessId: string): Promise<BusinessFileV2Row[]>;
  
  /**
   * Get a single file by ID
   * @param id - ID of the file
   */
  getFileById(id: string): Promise<BusinessFileV2Row | null>;
  
  /**
   * Get a file by its original name
   * @param businessId - ID of the business
   * @param originalName - Original name of the file
   */
  getFileByOriginalName(
    businessId: string, 
    originalName: string
  ): Promise<BusinessFileV2Row | null>;
  
  /**
   * Create a new file record
   * @param params - File creation parameters
   */
  createFile(params: CreateFileParams): Promise<BusinessFileV2Row>;
  
  /**
   * Update a file record
   * @param id - ID of the file to update
   * @param params - File update parameters
   */
  updateFile(id: string, params: UpdateFileParams): Promise<BusinessFileV2Row>;
  
  /**
   * Delete a file record and its associated storage
   * @param id - ID of the file to delete
   */
  deleteFile(id: string): Promise<void>;
  
  /**
   * Delete a file by its original name
   * @param businessId - ID of the business
   * @param originalName - Original name of the file
   */
  deleteFileByOriginalName(
    businessId: string,
    originalName: string
  ): Promise<void>;
  
  /**
   * Get files by type for a business
   * @param businessId - ID of the business
   * @param fileType - Type of files to retrieve
   */
  getFilesByType(businessId: string, fileType: BusinessFileType): Promise<BusinessFileV2Row[]>;
}