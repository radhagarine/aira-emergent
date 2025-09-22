// lib/database/interfaces/service-details.interface.ts
import { IRepository } from './base.repository';
import {
  ServiceDetailsV2Row,
  ServiceDetailsV2Insert,
  ServiceDetailsV2Update
} from '@/lib/types/database/business.types';

export interface IServiceDetailsRepository extends IRepository {
  /**
   * Get service details for a specific business
   * @param businessId - ID of the business
   */
  getByBusinessId(businessId: string): Promise<ServiceDetailsV2Row | null>;

  /**
   * Create new service details
   * @param data - Service details data to create
   */
  create(data: ServiceDetailsV2Insert): Promise<ServiceDetailsV2Row>;

  /**
   * Update existing service details
   * @param id - ID of the service details record
   * @param data - Updated service details data
   */
  update(id: string, data: ServiceDetailsV2Update): Promise<ServiceDetailsV2Row>;

  /**
   * Delete service details
   * @param id - ID of the service details record to delete
   */
  delete(id: string): Promise<void>;
}