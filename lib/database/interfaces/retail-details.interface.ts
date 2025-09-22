// lib/database/interfaces/retail-details.interface.ts
import { IRepository } from './base.repository';
import {
  RetailDetailsV2Row,
  RetailDetailsV2Insert,
  RetailDetailsV2Update
} from '@/lib/types/database/business.types';

export interface IRetailDetailsRepository extends IRepository {
  /**
   * Get retail details for a specific business
   * @param businessId - ID of the business
   */
  getByBusinessId(businessId: string): Promise<RetailDetailsV2Row | null>;

  /**
   * Create new retail details
   * @param data - Retail details data to create
   */
  create(data: RetailDetailsV2Insert): Promise<RetailDetailsV2Row>;

  /**
   * Update existing retail details
   * @param id - ID of the retail details record
   * @param data - Updated retail details data
   */
  update(id: string, data: RetailDetailsV2Update): Promise<RetailDetailsV2Row>;

  /**
   * Delete retail details
   * @param id - ID of the retail details record to delete
   */
  delete(id: string): Promise<void>;
}