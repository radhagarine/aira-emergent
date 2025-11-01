// lib/services/twilio/types.ts

import { BusinessNumberType } from '@/lib/types/database/numbers.types';

/**
 * Twilio available phone number from search results
 */
export interface TwilioAvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
  region: string | null;
  isoCountry: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  addressRequirements?: 'none' | 'any' | 'local' | 'foreign';
}

/**
 * Search parameters for available numbers
 */
export interface TwilioNumberSearchParams {
  countryCode: string;          // ISO country code (e.g., 'US', 'GB')
  numberType: 'local' | 'tollFree' | 'mobile';
  areaCode?: string;             // For US/CA local numbers
  contains?: string;             // Pattern to match
  inRegion?: string;             // State/province (e.g., 'CA', 'NY')
  inPostalCode?: string;         // Postal code
  smsEnabled?: boolean;
  mmsEnabled?: boolean;
  voiceEnabled?: boolean;
  limit?: number;                // Max results (default: 50)
}

/**
 * Twilio number search result
 */
export interface TwilioNumberSearchResult {
  numbers: TwilioAvailableNumber[];
  total: number;
}

/**
 * Parameters for purchasing a number
 */
export interface TwilioNumberPurchaseParams {
  phoneNumber: string;           // E.164 format
  friendlyName?: string;
  voiceUrl?: string;
  voiceMethod?: 'GET' | 'POST';
  smsUrl?: string;
  smsMethod?: 'GET' | 'POST';
  statusCallback?: string;
  statusCallbackMethod?: 'GET' | 'POST';
  addressSid?: string;           // Required for some countries
  bundleSid?: string;            // Required for some countries
}

/**
 * Purchased Twilio number details
 */
export interface TwilioPurchasedNumber {
  sid: string;
  accountSid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  voiceUrl: string | null;
  smsUrl: string | null;
  statusCallback: string | null;
  dateCreated: Date;
  dateUpdated: Date;
}

/**
 * Twilio pricing information
 */
export interface TwilioNumberPricing {
  country: string;
  countryCode: string;
  numberType: BusinessNumberType;
  monthlyCost: number;           // In USD
  setupCost: number;             // One-time cost in USD
}

/**
 * Static pricing configuration
 */
export const TWILIO_PRICING: Record<string, Record<BusinessNumberType, TwilioNumberPricing>> = {
  US: {
    [BusinessNumberType.LOCAL]: {
      country: 'United States',
      countryCode: 'US',
      numberType: BusinessNumberType.LOCAL,
      monthlyCost: 1.50,
      setupCost: 0,
    },
    [BusinessNumberType.TOLL_FREE]: {
      country: 'United States',
      countryCode: 'US',
      numberType: BusinessNumberType.TOLL_FREE,
      monthlyCost: 3.00,
      setupCost: 0,
    },
    [BusinessNumberType.MOBILE]: {
      country: 'United States',
      countryCode: 'US',
      numberType: BusinessNumberType.MOBILE,
      monthlyCost: 2.00,
      setupCost: 0,
    },
    [BusinessNumberType.INTERNATIONAL]: {
      country: 'United States',
      countryCode: 'US',
      numberType: BusinessNumberType.INTERNATIONAL,
      monthlyCost: 1.50,
      setupCost: 0,
    },
    [BusinessNumberType.VANITY]: {
      country: 'United States',
      countryCode: 'US',
      numberType: BusinessNumberType.VANITY,
      monthlyCost: 1.50,
      setupCost: 0,
    },
  },
  CA: {
    [BusinessNumberType.LOCAL]: {
      country: 'Canada',
      countryCode: 'CA',
      numberType: BusinessNumberType.LOCAL,
      monthlyCost: 1.50,
      setupCost: 0,
    },
    [BusinessNumberType.TOLL_FREE]: {
      country: 'Canada',
      countryCode: 'CA',
      numberType: BusinessNumberType.TOLL_FREE,
      monthlyCost: 3.00,
      setupCost: 0,
    },
    [BusinessNumberType.MOBILE]: {
      country: 'Canada',
      countryCode: 'CA',
      numberType: BusinessNumberType.MOBILE,
      monthlyCost: 2.00,
      setupCost: 0,
    },
    [BusinessNumberType.INTERNATIONAL]: {
      country: 'Canada',
      countryCode: 'CA',
      numberType: BusinessNumberType.INTERNATIONAL,
      monthlyCost: 1.50,
      setupCost: 0,
    },
    [BusinessNumberType.VANITY]: {
      country: 'Canada',
      countryCode: 'CA',
      numberType: BusinessNumberType.VANITY,
      monthlyCost: 1.50,
      setupCost: 0,
    },
  },
  GB: {
    [BusinessNumberType.LOCAL]: {
      country: 'United Kingdom',
      countryCode: 'GB',
      numberType: BusinessNumberType.LOCAL,
      monthlyCost: 2.25,
      setupCost: 0,
    },
    [BusinessNumberType.TOLL_FREE]: {
      country: 'United Kingdom',
      countryCode: 'GB',
      numberType: BusinessNumberType.TOLL_FREE,
      monthlyCost: 4.00,
      setupCost: 0,
    },
    [BusinessNumberType.MOBILE]: {
      country: 'United Kingdom',
      countryCode: 'GB',
      numberType: BusinessNumberType.MOBILE,
      monthlyCost: 3.00,
      setupCost: 0,
    },
    [BusinessNumberType.INTERNATIONAL]: {
      country: 'United Kingdom',
      countryCode: 'GB',
      numberType: BusinessNumberType.INTERNATIONAL,
      monthlyCost: 2.25,
      setupCost: 0,
    },
    [BusinessNumberType.VANITY]: {
      country: 'United Kingdom',
      countryCode: 'GB',
      numberType: BusinessNumberType.VANITY,
      monthlyCost: 2.25,
      setupCost: 0,
    },
  },
};

/**
 * Get pricing for a specific country and number type
 */
export function getTwilioPricing(countryCode: string, numberType: BusinessNumberType): TwilioNumberPricing | null {
  return TWILIO_PRICING[countryCode]?.[numberType] || null;
}

/**
 * Supported countries for number purchasing
 */
export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];
