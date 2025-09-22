import { BusinessFileV2Row } from '../database/business.types';

export type FileType = 'knowledge_base' | 'csv_config';

export interface FileUploadResult {
  file: BusinessFileV2Row;
  url: string;
}