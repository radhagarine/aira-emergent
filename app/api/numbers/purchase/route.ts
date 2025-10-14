// app/api/numbers/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTwilioNumbersService } from '@/lib/services/twilio';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { WalletService } from '@/lib/services/wallet/wallet.service';
import { TransactionService } from '@/lib/services/transaction/transaction.service';
import { BusinessNumbersService } from '@/lib/services/numbers/business-numbers.service';
import { BusinessNumberType } from '@/lib/types/database/numbers.types';

export const runtime = 'nodejs';

/**
 * POST /api/numbers/purchase
 * Purchase a phone number from Twilio
 */
export async function POST(request: NextRequest) {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Database configuration missing' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let twilioSid: string | null = null;
  let transactionCreated = false;

  try {
    const body = await request.json();
    const {
      phoneNumber,
      displayName,
      countryCode,
      numberType,
      userId, // In production, get from auth session
    } = body;

    // Validate required parameters
    if (!phoneNumber || !displayName || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize services
    const repositoryFactory = RepositoryFactory.createWithClient(supabase);
    const twilioService = getTwilioNumbersService();
    const walletService = new WalletService(repositoryFactory);
    const transactionService = new TransactionService(repositoryFactory);
    const businessNumbersService = new BusinessNumbersService(repositoryFactory);

    // Get pricing
    const monthlyCost = twilioService.getPricing(
      countryCode || 'US',
      numberType || BusinessNumberType.LOCAL
    );

    if (monthlyCost === 0) {
      return NextResponse.json(
        { error: 'Pricing not available for this number type' },
        { status: 400 }
      );
    }

    // Step 1: Check wallet balance
    // TEMPORARILY DISABLED FOR TESTING - Re-enable in production
    /* const hasSufficientBalance = await walletService.hasSufficientBalance(
      userId,
      monthlyCost,
      'USD'
    );

    if (!hasSufficientBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: $${monthlyCost.toFixed(2)}`,
          code: 'INSUFFICIENT_BALANCE',
          requiredAmount: monthlyCost,
        },
        { status: 402 }
      );
    } */
    console.log('[TEST MODE] Skipping wallet balance check - userId:', userId, 'monthlyCost:', monthlyCost);

    // Step 2: Purchase number from Twilio
    const webhookBaseUrl = process.env.TWILIO_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

    const twilioNumber = await twilioService.purchaseNumber({
      phoneNumber,
      friendlyName: displayName,
      voiceUrl: `${webhookBaseUrl}/api/voice-agent/handle-call`,
      voiceMethod: 'POST',
      smsUrl: `${webhookBaseUrl}/api/voice-agent/handle-sms`,
      smsMethod: 'POST',
      statusCallback: `${webhookBaseUrl}/api/voice-agent/status`,
      statusCallbackMethod: 'POST',
    });

    twilioSid = twilioNumber.sid;

    // Step 3: Deduct from wallet
    // TEMPORARILY DISABLED FOR TESTING - Re-enable in production
    /* await walletService.deductFunds(
      userId,
      monthlyCost,
      'USD',
      `Phone number purchase: ${phoneNumber}`
    ); */
    console.log('[TEST MODE] Skipping wallet deduction');

    // Step 4: Save to database (without business_id - will be assigned later)
    const savedNumber = await businessNumbersService.createNumber({
      user_id: userId,
      business_id: null, // Not assigned to business yet
      phone_number: phoneNumber,
      display_name: displayName,
      country_code: countryCode || 'US',
      number_type: numberType || BusinessNumberType.LOCAL,
      provider: 'twilio',
      monthly_cost: monthlyCost,
      purchase_date: new Date().toISOString(),
      is_primary: false,
      is_active: true,
      // Twilio-specific fields
      twilio_sid: twilioNumber.sid,
      twilio_account_sid: twilioNumber.accountSid,
      voice_url: twilioNumber.voiceUrl,
      sms_url: twilioNumber.smsUrl,
      status_callback_url: twilioNumber.statusCallback,
      capabilities: twilioNumber.capabilities,
      features: Object.keys(twilioNumber.capabilities).filter(
        (key) => twilioNumber.capabilities[key as keyof typeof twilioNumber.capabilities]
      ),
    });

    // Step 5: Create transaction record
    await transactionService.createPhoneNumberPurchaseTransaction(
      userId,
      monthlyCost,
      'USD',
      savedNumber.id
    );

    transactionCreated = true;

    return NextResponse.json({
      success: true,
      number: savedNumber,
      transaction: {
        amount: monthlyCost,
        currency: 'USD',
      },
    });
  } catch (error: any) {
    console.error('[API /api/numbers/purchase] Error:', error);

    // Rollback: Release Twilio number if purchased
    if (twilioSid) {
      try {
        const twilioService = getTwilioNumbersService();
        await twilioService.releaseNumber(twilioSid);
        console.log(`[API /api/numbers/purchase] Rolled back Twilio number: ${twilioSid}`);
      } catch (rollbackError) {
        console.error('[API /api/numbers/purchase] Failed to rollback Twilio number:', rollbackError);
      }
    }

    // Handle specific errors
    if (error.message?.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: error.message, code: 'INSUFFICIENT_BALANCE' },
        { status: 402 }
      );
    }

    if (error.message?.includes('no longer available')) {
      return NextResponse.json(
        { error: 'This phone number is no longer available', code: 'NUMBER_UNAVAILABLE' },
        { status: 410 }
      );
    }

    if (error.message?.includes('not configured')) {
      return NextResponse.json(
        { error: 'Phone number provisioning is not configured', code: 'TWILIO_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to purchase phone number',
        code: 'PURCHASE_FAILED',
      },
      { status: 500 }
    );
  }
}
