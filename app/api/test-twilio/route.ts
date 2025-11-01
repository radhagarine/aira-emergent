// Diagnostic endpoint to test Twilio configuration
import { NextResponse } from 'next/server';
import { isTwilioConfigured, getTwilioClient } from '@/lib/services/twilio/twilio.service';

export const runtime = 'nodejs';

export async function GET() {
  console.log('=== Twilio Diagnostic Test ===');

  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  console.log('TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING');
  console.log('TWILIO_AUTH_TOKEN:', authToken ? `Present (length: ${authToken.length})` : 'MISSING');

  // Check service configuration
  console.log('isTwilioConfigured():', isTwilioConfigured());

  if (!isTwilioConfigured()) {
    return NextResponse.json({
      error: 'Twilio is not configured',
      accountSid: !!accountSid,
      authToken: !!authToken,
      configured: false,
    }, { status: 500 });
  }

  try {
    console.log('Getting Twilio client...');
    const client = getTwilioClient();
    console.log('Twilio client obtained');

    // Test simple API call
    console.log('Testing account fetch...');
    const startTime = Date.now();

    const account = await client.api.accounts(accountSid!).fetch();
    const endTime = Date.now();

    console.log(`Account fetch completed in ${endTime - startTime}ms`);
    console.log('Account status:', account.status);

    // Test available numbers search
    console.log('Testing available numbers search...');
    const searchStart = Date.now();

    const numbers = await client.availablePhoneNumbers('US').local.list({ limit: 1 });
    const searchEnd = Date.now();

    console.log(`Numbers search completed in ${searchEnd - searchStart}ms`);
    console.log(`Found ${numbers.length} number(s)`);

    return NextResponse.json({
      success: true,
      configured: true,
      accountStatus: account.status,
      accountType: account.type,
      testResults: {
        accountFetchTime: `${endTime - startTime}ms`,
        numbersSearchTime: `${searchEnd - searchStart}ms`,
        numbersFound: numbers.length,
      },
    });
  } catch (error: any) {
    console.error('Error during Twilio test:', error);
    return NextResponse.json({
      error: error.message,
      code: error.code,
      configured: isTwilioConfigured(),
    }, { status: 500 });
  }
}
