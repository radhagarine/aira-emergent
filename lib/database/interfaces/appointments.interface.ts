import { IRepository } from './base.repository';
import {
  AppointmentV2Row,
  AppointmentV2Insert,
  AppointmentV2Update,
  AppointmentStatus
} from '@/lib/types/database/business.types';

export interface IAppointmentsRepository extends IRepository {
  getByBusinessId(
    businessId: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<AppointmentV2Row[]>;
  
  getById(id: string): Promise<AppointmentV2Row | null>;
  create(data: AppointmentV2Insert): Promise<AppointmentV2Row>;
  update(id: string, data: AppointmentV2Update): Promise<AppointmentV2Row>;
  delete(id: string): Promise<void>;
  
  // Simple method to get appointments by status
  getByStatus(
    businessId: string, 
    status: AppointmentStatus,
    dateRange?: { start: Date; end: Date }
  ): Promise<AppointmentV2Row[]>;

  /**
   * Check if a time slot is available (no overlapping appointments)
   * Optionally exclude a specific appointment (useful for updates)
   */
  isTimeSlotAvailable(
    businessId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean>;

  _setTestMode(isTestMode: boolean): void;
}