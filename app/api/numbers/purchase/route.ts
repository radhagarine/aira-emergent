// app/api/numbers/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTwilioNumbersService } from '@/lib/services/twilio';
import type { TwilioPurchasedNumber } from '@/lib/services/twilio/types';
import { TwilioConfig } from '@/lib/services/twilio/twilio.config';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { WalletService } from '@/lib/services/wallet/wallet.service';
import { TransactionService } from '@/lib/services/transaction/transaction.service';
import { BusinessNumbersService } from '@/lib/services/numbers/business-numbers.service';
import { BusinessNumberType } from '@/lib/types/database/numbers.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/numbers/purchase
 * Purchase a phone number from Twilio
 */
export async function POST(request: NextRequest) {
  console.log('[Purchase API] Request headers:', {
    cookie: request.headers.get('cookie'),
    authorization: request.headers.get('authorization'),
  });

  // Initialize authenticated Supabase client with user session
  const cookieStore = await cookies();

  console.log('[Purchase API] Cookies from store:', cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          console.log(`[Purchase API] Cookie get: ${name} = ${value ? 'EXISTS' : 'NULL'}`);
          return value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in middleware/server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in middleware/server components
          }
        },
      },
    }
  );

  // Verify user is authenticated
  // Use getUser() instead of getSession() for API routes - it validates the JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('[Purchase API] User check:', {
    hasUser: !!user,
    userId: user?.id,
    userError: userError,
    cookies: cookieStore.getAll().map(c => c.name), // Debug: show which cookies are available
  });

  if (userError || !user) {
    console.error('[Purchase API] No user or error:', userError);
    return NextResponse.json(
      { error: 'Unauthorized - please log in' },
      { status: 401 }
    );
  }
  let twilioSid: string | null = null;
  let transactionCreated = false;
  let pendingNumberId: string | null = null;

  try {
    const body = await request.json();
    const {
      phoneNumber,
      displayName,
      countryCode,
      numberType,
    } = body;

    // Get userId from authenticated user (not from request body)
    const userId = user.id;

    // Validate required parameters
    if (!phoneNumber || !displayName) {
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

    // Step 1: Check wallet balance (ENABLED FOR WALLET TESTING)
    const hasSufficientBalance = await walletService.hasSufficientBalance(
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
    }
    console.log('[WALLET TEST] Wallet balance check passed - userId:', userId, 'monthlyCost:', monthlyCost);

    // Step 2: Create database record FIRST with 'pending' status
    // This ensures we don't lose money if DB fails after Twilio purchase
    try {
      const pendingNumber = await businessNumbersService.createNumber({
        user_id: userId,
        business_id: null,
        phone_number: phoneNumber,
        display_name: displayName,
        country_code: countryCode || 'US',
        number_type: numberType || BusinessNumberType.LOCAL,
        provider: 'twilio',
        monthly_cost: monthlyCost,
        purchase_date: new Date().toISOString(),
        is_primary: false,
        is_active: false, // Mark as inactive until Twilio purchase succeeds
        twilio_sid: null, // Will be updated after Twilio purchase
      });

      pendingNumberId = pendingNumber.id;
      console.log('[Purchase] Database record created:', pendingNumberId);
    } catch (dbError: any) {
      console.error('[Purchase] Failed to create database record:', dbError);
      throw new Error('Failed to create phone number record. Please check RLS policies are configured.');
    }

    // Step 3: Purchase number from Twilio (money is charged HERE)
    const webhookBaseUrl = process.env.TWILIO_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

    let twilioNumber: TwilioPurchasedNumber;
    try {
      twilioNumber = await twilioService.purchaseNumber({
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
      console.log('[Purchase] Twilio number purchased:', twilioSid);
    } catch (twilioError: any) {
      // Twilio purchase failed - delete the pending database record
      console.error('[Purchase] Twilio purchase failed:', twilioError);
      if (pendingNumberId) {
        try {
          await businessNumbersService.deleteNumber(pendingNumberId);
          console.log('[Purchase] Cleaned up pending database record');
        } catch (cleanupError) {
          console.error('[Purchase] Failed to cleanup database record:', cleanupError);
        }
      }
      throw twilioError;
    }

    // Step 4: Update database record with Twilio details and mark as active
    const savedNumber = await businessNumbersService.updateNumber(pendingNumberId!, {
      is_active: true,
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

    console.log('[Purchase] Database record updated with Twilio details');

    // Step 5: Deduct from wallet (ENABLED FOR WALLET TESTING)
    await walletService.deductFunds(
      userId,
      monthlyCost,
      'USD',
      `Phone number purchase: ${phoneNumber}`
    );
    console.log('[WALLET TEST] Wallet deduction completed - amount:', monthlyCost);

    // Step 6: Create transaction record (ENABLED FOR WALLET TESTING)
    await transactionService.createPhoneNumberPurchaseTransaction(
      userId,
      monthlyCost,
      'USD',
      savedNumber.id
    );
    transactionCreated = true;
    console.log('[WALLET TEST] Transaction record created');

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

    // IMPORTANT: DO NOT rollback Twilio number if it was successfully purchased
    // The money has already been charged, so releasing the number would lose both money and the number
    // Instead, keep the DB record in pending state (is_active=false) so admin can investigate
    if (twilioSid) {
      console.error(
        `[API /api/numbers/purchase] CRITICAL: Twilio number ${twilioSid} was purchased but DB update failed. ` +
        `Database record ${pendingNumberId || 'unknown'} exists in pending state. ` +
        `DO NOT release the number - money has been charged. Manual intervention required.`
      );
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
