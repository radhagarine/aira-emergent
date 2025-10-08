// app/api/payment/create-checkout-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getStripeService } from '@/lib/services/payment/stripe.service';
import { getTransactionService } from '@/lib/services/service.factory';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Currency } from '@/lib/types/database/wallet.types';

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, currency } = body;

    // Validate input
    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Amount and currency are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!['USD', 'INR'].includes(currency)) {
      return NextResponse.json(
        { error: 'Currency must be USD or INR' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    const stripeService = getStripeService();
    if (!stripeService.isAvailable()) {
      return NextResponse.json(
        {
          error: 'Payment processing is currently unavailable. Please contact support.',
          code: 'PAYMENT_SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripeService.createCheckoutSession({
      userId: user.id,
      amount: parseFloat(amount),
      currency: currency as Currency,
      successUrl: `${baseUrl}/dashboard/funds?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${baseUrl}/dashboard/funds?canceled=true`,
    });

    // Create pending transaction record
    const transactionService = getTransactionService();
    await transactionService.createStripePaymentTransaction(
      user.id,
      parseFloat(amount),
      currency as Currency,
      session.id
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
