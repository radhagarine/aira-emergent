// lib/types/database/business.types.ts
import { Database } from '@/lib/database/database.types'

// Core business types
export type BusinessV2Row = Database['public']['Tables']['business_v2']['Row'];
export type BusinessV2Insert = Database['public']['Tables']['business_v2']['Insert'];
export type BusinessV2Update = Database['public']['Tables']['business_v2']['Update'];

// Business type enum
export type BusinessType = Database['public']['Enums']['business_type'];
export type AppointmentStatus = Database['public']['Enums']['appointment_status'];

// Type-specific details
export type RestaurantDetailsV2Row = Database['public']['Tables']['restaurant_details_v2']['Row'];
export type RestaurantDetailsV2Insert = Database['public']['Tables']['restaurant_details_v2']['Insert'];
export type RestaurantDetailsV2Update = Database['public']['Tables']['restaurant_details_v2']['Update'];

export type RetailDetailsV2Row = Database['public']['Tables']['retail_details_v2']['Row'];
export type RetailDetailsV2Insert = Database['public']['Tables']['retail_details_v2']['Insert'];
export type RetailDetailsV2Update = Database['public']['Tables']['retail_details_v2']['Update'];

export type ServiceDetailsV2Row = Database['public']['Tables']['service_details_v2']['Row'];
export type ServiceDetailsV2Insert = Database['public']['Tables']['service_details_v2']['Insert'];
export type ServiceDetailsV2Update = Database['public']['Tables']['service_details_v2']['Update'];

export type AppointmentV2Row = Database['public']['Tables']['appointments_v2']['Row'];
export type AppointmentV2Insert = Database['public']['Tables']['appointments_v2']['Insert'];
export type AppointmentV2Update = Database['public']['Tables']['appointments_v2']['Update'];

// File types
export type BusinessFileV2Row = Database['public']['Tables']['business_files_v2']['Row'];
export type BusinessFileV2Insert = Database['public']['Tables']['business_files_v2']['Insert'];
export type BusinessFileV2Update = Database['public']['Tables']['business_files_v2']['Update'];

// Combined business response with details
export type BusinessWithDetails = BusinessV2Row & {
  id: string;
  name: string;
  type: BusinessType;
  restaurant_details_v2?: RestaurantDetailsV2Row | null;
  retail_details_v2?: RetailDetailsV2Row | null;
  service_details_v2?: ServiceDetailsV2Row | null;
};

export enum BusinessFileType {
  KnowledgeBase = 'knowledge_base',
  CSVConfig = 'csv_config',
  ProfileImage = 'profile_image',
  Document = 'document',
  Other = 'other'
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export type OperatingHours = Record<WeekDay, DaySchedule>;