// lib/services/twilio/twilio-numbers.service.ts

import { getTwilioClient, isTwilioConfigured } from './twilio.service';
import {
  TwilioAvailableNumber,
  TwilioNumberSearchParams,
  TwilioNumberSearchResult,
  TwilioNumberPurchaseParams,
  TwilioPurchasedNumber,
  getTwilioPricing,
} from './types';
import { BusinessNumberType } from '@/lib/types/database/numbers.types';

/**
 * Service for managing Twilio phone numbers
 */
export class TwilioNumbersService {
  private static instance: TwilioNumbersService | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TwilioNumbersService {
    if (!TwilioNumbersService.instance) {
      TwilioNumbersService.instance = new TwilioNumbersService();
    }
    return TwilioNumbersService.instance;
  }

  /**
   * Search for available phone numbers
   */
  public async searchAvailableNumbers(
    params: TwilioNumberSearchParams
  ): Promise<TwilioNumberSearchResult> {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured');
    }

    const client = getTwilioClient();
    const { countryCode, numberType, limit = 50, ...searchFilters } = params;

    try {
      let numbers: any[] = [];

      // Build search parameters
      const twilioParams: any = {
        limit,
        ...searchFilters,
      };

      // Search based on number type
      if (numberType === 'local') {
        numbers = await client
          .availablePhoneNumbers(countryCode)
          .local.list(twilioParams);
      } else if (numberType === 'tollFree') {
        numbers = await client
          .availablePhoneNumbers(countryCode)
          .tollFree.list(twilioParams);
      } else if (numberType === 'mobile') {
        numbers = await client
          .availablePhoneNumbers(countryCode)
          .mobile.list(twilioParams);
      }

      // Map Twilio response to our format
      const availableNumbers: TwilioAvailableNumber[] = numbers.map((num) => ({
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
        locality: num.locality || null,
        region: num.region || null,
        isoCountry: num.isoCountry,
        capabilities: {
          voice: num.capabilities?.voice ?? true,
          sms: num.capabilities?.sms ?? true,
          mms: num.capabilities?.mms ?? false,
          fax: num.capabilities?.fax ?? false,
        },
        addressRequirements: num.addressRequirements || 'none',
      }));

      return {
        numbers: availableNumbers,
        total: availableNumbers.length,
      };
    } catch (error: any) {
      console.error('[TwilioNumbersService] Error searching numbers:', error);
      throw new Error(`Failed to search numbers: ${error.message}`);
    }
  }

  /**
   * Purchase a phone number from Twilio
   */
  public async purchaseNumber(
    params: TwilioNumberPurchaseParams
  ): Promise<TwilioPurchasedNumber> {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured');
    }

    const client = getTwilioClient();

    try {
      const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
        phoneNumber: params.phoneNumber,
        friendlyName: params.friendlyName,
        voiceUrl: params.voiceUrl,
        voiceMethod: params.voiceMethod || 'POST',
        smsUrl: params.smsUrl,
        smsMethod: params.smsMethod || 'POST',
        statusCallback: params.statusCallback,
        statusCallbackMethod: params.statusCallbackMethod || 'POST',
        addressSid: params.addressSid,
        bundleSid: params.bundleSid,
      });

      return {
        sid: incomingPhoneNumber.sid,
        accountSid: incomingPhoneNumber.accountSid,
        phoneNumber: incomingPhoneNumber.phoneNumber,
        friendlyName: incomingPhoneNumber.friendlyName || '',
        capabilities: {
          voice: incomingPhoneNumber.capabilities?.voice ?? true,
          sms: incomingPhoneNumber.capabilities?.sms ?? true,
          mms: incomingPhoneNumber.capabilities?.mms ?? false,
          fax: incomingPhoneNumber.capabilities?.fax ?? false,
        },
        voiceUrl: incomingPhoneNumber.voiceUrl || null,
        smsUrl: incomingPhoneNumber.smsUrl || null,
        statusCallback: incomingPhoneNumber.statusCallback || null,
        dateCreated: incomingPhoneNumber.dateCreated,
        dateUpdated: incomingPhoneNumber.dateUpdated,
      };
    } catch (error: any) {
      console.error('[TwilioNumbersService] Error purchasing number:', error);

      // Handle specific Twilio errors
      if (error.code === 20404) {
        throw new Error('Phone number is no longer available');
      } else if (error.code === 21452) {
        throw new Error('Address or Bundle required for this number');
      } else if (error.code === 20003) {
        throw new Error('Twilio authentication failed');
      } else if (error.code === 21608) {
        throw new Error('Insufficient balance in Twilio account');
      }

      throw new Error(`Failed to purchase number: ${error.message}`);
    }
  }

  /**
   * Release/delete a phone number
   */
  public async releaseNumber(twilioSid: string): Promise<void> {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured');
    }

    const client = getTwilioClient();

    try {
      await client.incomingPhoneNumbers(twilioSid).remove();
    } catch (error: any) {
      console.error('[TwilioNumbersService] Error releasing number:', error);

      if (error.code === 20404) {
        // Number already deleted or doesn't exist
        console.warn(`[TwilioNumbersService] Number ${twilioSid} not found in Twilio, assuming already deleted`);
        return;
      }

      throw new Error(`Failed to release number: ${error.message}`);
    }
  }

  /**
   * Update phone number configuration
   */
  public async updateNumber(
    twilioSid: string,
    updates: {
      friendlyName?: string;
      voiceUrl?: string;
      smsUrl?: string;
      statusCallback?: string;
    }
  ): Promise<TwilioPurchasedNumber> {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured');
    }

    const client = getTwilioClient();

    try {
      const updated = await client.incomingPhoneNumbers(twilioSid).update(updates);

      return {
        sid: updated.sid,
        accountSid: updated.accountSid,
        phoneNumber: updated.phoneNumber,
        friendlyName: updated.friendlyName || '',
        capabilities: {
          voice: updated.capabilities?.voice ?? true,
          sms: updated.capabilities?.sms ?? true,
          mms: updated.capabilities?.mms ?? false,
          fax: updated.capabilities?.fax ?? false,
        },
        voiceUrl: updated.voiceUrl || null,
        smsUrl: updated.smsUrl || null,
        statusCallback: updated.statusCallback || null,
        dateCreated: updated.dateCreated,
        dateUpdated: updated.dateUpdated,
      };
    } catch (error: any) {
      console.error('[TwilioNumbersService] Error updating number:', error);
      throw new Error(`Failed to update number: ${error.message}`);
    }
  }

  /**
   * Get details of a purchased number
   */
  public async getNumber(twilioSid: string): Promise<TwilioPurchasedNumber> {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured');
    }

    const client = getTwilioClient();

    try {
      const number = await client.incomingPhoneNumbers(twilioSid).fetch();

      return {
        sid: number.sid,
        accountSid: number.accountSid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName || '',
        capabilities: {
          voice: number.capabilities?.voice ?? true,
          sms: number.capabilities?.sms ?? true,
          mms: number.capabilities?.mms ?? false,
          fax: number.capabilities?.fax ?? false,
        },
        voiceUrl: number.voiceUrl || null,
        smsUrl: number.smsUrl || null,
        statusCallback: number.statusCallback || null,
        dateCreated: number.dateCreated,
        dateUpdated: number.dateUpdated,
      };
    } catch (error: any) {
      console.error('[TwilioNumbersService] Error fetching number:', error);
      throw new Error(`Failed to fetch number: ${error.message}`);
    }
  }

  /**
   * Get pricing for a number type in a country
   */
  public getPricing(countryCode: string, numberType: BusinessNumberType): number {
    const pricing = getTwilioPricing(countryCode, numberType);
    return pricing?.monthlyCost || 0;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static reset(): void {
    TwilioNumbersService.instance = null;
  }
}

/**
 * Helper function to get Twilio numbers service instance
 */
export function getTwilioNumbersService(): TwilioNumbersService {
  return TwilioNumbersService.getInstance();
}
