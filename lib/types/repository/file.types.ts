import { Json } from '@/lib/database/database.types';
import { BusinessFileType } from '@/lib/types/database/business.types';

/**
 * Parameters for creating a new file
 */
export interface CreateFileParams {
  /** The actual file to be uploaded */
  file: File;
  /** ID of the business this file belongs to */
  business_id: string;
  /** Type of business file */
  file_type: BusinessFileType;
  /** Original name of the file */
  original_name: string;
  /** Optional metadata for the file */
  metadata?: Json | null;
}

/**
 * Parameters for updating an existing file
 */
export interface UpdateFileParams {
  /** Optional new file to replace existing one */
  file?: File;
  /** Optional metadata updates */
  metadata?: Json | null;
  /** Optional new name for the file */
  original_name?: string;
}

/**
 * Response from file upload operations
 */
export interface FileUploadResponse {
  /** Path where file is stored */
  storagePath: string;
  /** Public URL of the file */
  publicUrl: string;
  /** Size of the uploaded file in bytes */
  size: number;
  /** MIME type of the file */
  mimeType: string;
}