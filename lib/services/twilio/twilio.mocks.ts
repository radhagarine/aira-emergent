// lib/services/twilio/twilio.mocks.ts

import { TwilioNumberPurchaseParams, TwilioPurchasedNumber } from './types';

/**
 * Generate a fake Twilio Phone Number SID
 */
export function generateMockPhoneNumberSid(): string {
  return `PN${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
}

/**
 * Generate a mock purchased number response
 */
export function createMockPurchasedNumber(
  params: TwilioNumberPurchaseParams
): TwilioPurchasedNumber {
  return {
    sid: generateMockPhoneNumberSid(),
    accountSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Fake account SID
    phoneNumber: params.phoneNumber,
    friendlyName: params.friendlyName || '',
    capabilities: {
      voice: true,
      sms: true,
      mms: false,
      fax: false,
    },
    voiceUrl: params.voiceUrl || null,
    smsUrl: params.smsUrl || null,
    statusCallback: params.statusCallback || null,
    dateCreated: new Date(),
    dateUpdated: new Date(),
  };
}

/**
 * Mock purchase number - simulates successful purchase without API call
 */
export async function mockPurchaseNumber(
  params: TwilioNumberPurchaseParams
): Promise<TwilioPurchasedNumber> {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🧪 MOCK PURCHASE - NO REAL API CALL                    │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│ Phone Number: ${params.phoneNumber.padEnd(39)} │`);
  console.log(`│ Display Name: ${(params.friendlyName || 'N/A').padEnd(39)} │`);
  console.log('│ Status: ✅ SUCCESS (simulated)                          │');
  console.log('└─────────────────────────────────────────────────────────┘');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResponse = createMockPurchasedNumber(params);
  console.log(`[MOCK] Generated fake SID: ${mockResponse.sid}`);

  return mockResponse;
}

/**
 * Mock release number - simulates successful release without API call
 */
export async function mockReleaseNumber(twilioSid: string): Promise<void> {
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 🧪 MOCK RELEASE - NO REAL API CALL                     │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│ Twilio SID: ${twilioSid.padEnd(41)} │`);
  console.log('│ Status: ✅ SUCCESS (simulated)                          │');
  console.log('└─────────────────────────────────────────────────────────┘');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log(`[MOCK] Number ${twilioSid} would have been released`);
}
