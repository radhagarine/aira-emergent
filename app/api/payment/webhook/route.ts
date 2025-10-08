// app/api/payment/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getStripeService } from '@/lib/services/payment/stripe.service';
import { getTransactionService, getWalletService } from '@/lib/services/service.factory';
import { getTransactionRepository } from '@/lib/database/repository.factory';
import { TransactionStatus } from '@/lib/types/database/transaction.types';
import { Currency } from '@/lib/types/database/wallet.types';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const stripeService = getStripeService();
    let event: Stripe.Event;

    try {
      event = stripeService.verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutFailed(session);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.client_reference_id || session.metadata?.userId;
    const amount = session.metadata?.amount;
    const currency = session.metadata?.currency as Currency;

    if (!userId || !amount || !currency) {
      console.error('Missing required metadata in checkout session');
      return;
    }

    // Get transaction by session ID
    const transactionRepo = getTransactionRepository();
    const transaction = await transactionRepo.getByStripeCheckoutSessionId(session.id);

    if (!transaction) {
      console.error('Transaction not found for session:', session.id);
      return;
    }

    // Update transaction status to completed
    const transactionService = getTransactionService();
    await transactionService.updateTransactionStatus(
      transaction.id,
      TransactionStatus.COMPLETED
    );

    // Add funds to wallet (this will be handled by DB trigger, but we can also do it explicitly)
    const walletService = getWalletService();
    await walletService.addFunds(userId, parseFloat(amount), currency);

    console.log(`Payment completed for user ${userId}: ${amount} ${currency}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  try {
    // Get transaction by session ID
    const transactionRepo = getTransactionRepository();
    const transaction = await transactionRepo.getByStripeCheckoutSessionId(session.id);

    if (!transaction) {
      console.error('Transaction not found for session:', session.id);
      return;
    }

    // Update transaction status to failed
    const transactionService = getTransactionService();
    await transactionService.updateTransactionStatus(
      transaction.id,
      TransactionStatus.FAILED
    );

    console.log(`Payment failed for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout failed:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Get transaction by payment intent ID
    const transactionRepo = getTransactionRepository();
    const transaction = await transactionRepo.getByStripePaymentId(paymentIntent.id);

    if (!transaction) {
      console.log('Transaction not found for payment intent:', paymentIntent.id);
      return;
    }

    // Update transaction status to failed
    const transactionService = getTransactionService();
    await transactionService.updateTransactionStatus(
      transaction.id,
      TransactionStatus.FAILED
    );

    console.log(`Payment intent failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}
