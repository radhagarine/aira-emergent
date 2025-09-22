// types.ts
import { ReactNode } from 'react';
import { AppointmentStatus as ServiceAppointmentStatus } from '@/lib/types/database/business.types';

// Local interface for appointments that matches what the UI components expect
export interface Appointment {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  description: string | null;
  party_size: number; 
  created_at: string;
  updated_at: string;
}

// Use the same enum values as the service layer, but define it here for UI components
// This ensures UI component types match the service layer
export type AppointmentStatus = ServiceAppointmentStatus;

export type CalendarView = 'day' | 'week' | 'month';

export interface StatusConfig {
  color: string;
  icon: ReactNode;
  text: string;
}