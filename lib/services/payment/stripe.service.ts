// lib/services/payment/stripe.service.ts

import Stripe from 'stripe';
import { Currency } from '@/lib/types/database/wallet.types';

export class StripeService {
  private stripe: Stripe | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY is not defined. Payment features will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-09-30.clover',
        typescript: true,
      });
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if Stripe is properly configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured || !this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable to enable payment features.'
      );
    }
  }

  /**
   * Check if payment features are available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Create a Stripe Checkout session for adding funds
   */
  async createCheckoutSession(params: {
    userId: string;
    amount: number;
    currency: Currency;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    this.ensureConfigured();

    try {
      const { userId, amount, currency, successUrl, cancelUrl } = params;

      // Convert amount to cents (Stripe expects smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const session = await this.stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Wallet Top-up',
                description: `Add ${currency} ${amount.toFixed(2)} to your wallet`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          userId,
          amount: amount.toString(),
          currency,
          type: 'wallet_topup',
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw error;
    }
  }

  /**
   * Retrieve a Stripe Checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    this.ensureConfigured();

    try {
      return await this.stripe!.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw error;
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    this.ensureConfigured();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      throw error;
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    this.ensureConfigured();

    try {
      return await this.stripe!.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    this.ensureConfigured();

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      return await this.stripe!.refunds.create(refundParams);
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }
}

// Singleton instance
let stripeServiceInstance: StripeService | null = null;

export const getStripeService = (): StripeService => {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService();
  }
  return stripeServiceInstance;
};
