// app/api/numbers/[numberId]/release/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTwilioNumbersService } from '@/lib/services/twilio';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { BusinessNumbersService } from '@/lib/services/numbers/business-numbers.service';
import { WalletService } from '@/lib/services/wallet/wallet.service';
import { TransactionService } from '@/lib/services/transaction/transaction.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/numbers/[numberId]/release
 * Release/delete a phone number
 * SECURITY: Requires authentication. RLS policies enforce ownership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ numberId: string }> }
) {
  // Initialize authenticated Supabase client with user session
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('[Release API] Authentication failed:', userError);
    return NextResponse.json(
      { error: 'Unauthorized - please log in' },
      { status: 401 }
    );
  }

  const { numberId } = await params;

  try {
    // Initialize services
    const repositoryFactory = RepositoryFactory.createWithClient(supabase);
    const businessNumbersService = new BusinessNumbersService(repositoryFactory);
    const walletService = new WalletService(repositoryFactory);
    const transactionService = new TransactionService(repositoryFactory);
    const twilioService = getTwilioNumbersService();

    // Get number from database
    const number = await businessNumbersService.getNumberById(numberId);

    if (!number) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Check if number is eligible for refund (within 30-day window)
    let refundIssued = false;
    let refundAmount = 0;

    if (number.purchase_date && number.monthly_cost) {
      const purchaseDate = new Date(number.purchase_date);
      const now = new Date();
      const daysSincePurchase = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      const REFUND_WINDOW_DAYS = 30;

      if (daysSincePurchase <= REFUND_WINDOW_DAYS) {
        try {
          refundAmount = Number(number.monthly_cost);

          // Issue refund to wallet
          await walletService.addFunds(user.id, refundAmount, 'USD');

          // Create refund transaction record
          await transactionService.createRefundTransaction(
            user.id,
            refundAmount,
            'USD',
            number.id,
            `Phone number ${number.phone_number} released within ${REFUND_WINDOW_DAYS}-day refund period`
          );

          refundIssued = true;
          console.log(`[Release] Refund issued: $${refundAmount} for number ${number.phone_number}`);
        } catch (refundError: any) {
          // Log error but continue with release - don't block user from releasing number
          console.error(`[Release] Failed to issue refund for number ${numberId}:`, refundError);
          // Admin will need to manually process refund
        }
      }
    }

    // Release from Twilio if it has a Twilio SID
    if (number.twilio_sid) {
      try {
        await twilioService.releaseNumber(number.twilio_sid);
      } catch (error: any) {
        // Log error but continue - number might already be deleted in Twilio
        console.warn(`[API /api/numbers/${numberId}/release] Failed to release from Twilio:`, error);
      }
    }

    // Delete from database
    await businessNumbersService.deleteNumber(numberId);

    return NextResponse.json({
      success: true,
      message: 'Phone number released successfully',
      refund: refundIssued ? {
        issued: true,
        amount: refundAmount,
        currency: 'USD'
      } : {
        issued: false,
        reason: 'Outside refund window or no purchase cost recorded'
      }
    });
  } catch (error: any) {
    console.error(`[API /api/numbers/${numberId}/release] Error:`, error);

    // Handle specific errors
    if (error.message?.includes('Cannot delete primary number')) {
      return NextResponse.json(
        {
          error: 'Cannot delete primary number. Please set another number as primary first.',
          code: 'PRIMARY_NUMBER_DELETE',
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Phone number not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to release phone number',
        code: 'RELEASE_FAILED',
      },
      { status: 500 }
    );
  }
}
