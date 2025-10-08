// lib/types/database/numbers.types.ts

export interface BusinessNumberRow {
  id: string;
  business_id: string;
  phone_number: string;
  display_name: string;
  country_code: string;
  is_primary: boolean;
  is_active: boolean;
  number_type: BusinessNumberType;
  provider: string | null;
  purchase_date: string | null;
  monthly_cost: number | null;
  features: string[] | null;
  notes: string | null;
  // Twilio-specific fields
  twilio_sid: string | null;
  twilio_account_sid: string | null;
  voice_url: string | null;
  sms_url: string | null;
  status_callback_url: string | null;
  capabilities: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessNumberInsert {
  id?: string;
  business_id: string;
  phone_number: string;
  display_name: string;
  country_code: string;
  is_primary?: boolean;
  is_active?: boolean;
  number_type: BusinessNumberType;
  provider?: string | null;
  purchase_date?: string | null;
  monthly_cost?: number | null;
  features?: string[] | null;
  notes?: string | null;
  // Twilio-specific fields
  twilio_sid?: string | null;
  twilio_account_sid?: string | null;
  voice_url?: string | null;
  sms_url?: string | null;
  status_callback_url?: string | null;
  capabilities?: Record<string, boolean> | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessNumberUpdate {
  id?: string;
  business_id?: string;
  phone_number?: string;
  display_name?: string;
  country_code?: string;
  is_primary?: boolean;
  is_active?: boolean;
  number_type?: BusinessNumberType;
  provider?: string | null;
  purchase_date?: string | null;
  monthly_cost?: number | null;
  features?: string | null;
  notes?: string | null;
  // Twilio-specific fields
  twilio_sid?: string | null;
  twilio_account_sid?: string | null;
  voice_url?: string | null;
  sms_url?: string | null;
  status_callback_url?: string | null;
  capabilities?: Record<string, boolean> | null;
  created_at?: string;
  updated_at?: string;
}

export enum BusinessNumberType {
  LOCAL = 'local',
  TOLL_FREE = 'toll_free',
  MOBILE = 'mobile',
  INTERNATIONAL = 'international',
  VANITY = 'vanity'
}

export enum NumberFeature {
  SMS = 'sms',
  VOICE = 'voice',
  FAX = 'fax',
  MMS = 'mms',
  CALL_FORWARDING = 'call_forwarding',
  VOICEMAIL = 'voicemail',
  CALL_RECORDING = 'call_recording',
  AUTO_ATTENDANT = 'auto_attendant'
}

export interface BusinessNumberWithBusiness extends BusinessNumberRow {
  business?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface NumberUsageStats {
  total_numbers: number;
  active_numbers: number;
  primary_numbers: number;
  by_type: Record<BusinessNumberType, number>;
  total_monthly_cost: number;
}