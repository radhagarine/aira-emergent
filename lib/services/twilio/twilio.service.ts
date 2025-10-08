// lib/services/twilio/twilio.service.ts

import twilio from 'twilio';
import type { Twilio } from 'twilio';

/**
 * Base Twilio service for initializing and managing Twilio client
 */
export class TwilioService {
  private static instance: TwilioService | null = null;
  private client: Twilio | null = null;
  private accountSid: string | null = null;
  private authToken: string | null = null;

  private constructor() {
    this.initializeClient();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Initialize Twilio client from environment variables
   */
  private initializeClient(): void {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || null;

    if (!this.accountSid || !this.authToken) {
      console.warn('[TwilioService] Twilio credentials not configured. Number provisioning will be disabled.');
      return;
    }

    try {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('[TwilioService] Twilio client initialized successfully');
    } catch (error) {
      console.error('[TwilioService] Failed to initialize Twilio client:', error);
      this.client = null;
    }
  }

  /**
   * Get Twilio client instance
   * @throws Error if client is not initialized
   */
  public getClient(): Twilio {
    if (!this.client) {
      throw new Error('Twilio client is not initialized. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }
    return this.client;
  }

  /**
   * Check if Twilio is configured and ready
   */
  public isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get account SID
   */
  public getAccountSid(): string | null {
    return this.accountSid;
  }

  /**
   * Validate Twilio webhook signature
   * @param signature The X-Twilio-Signature header value
   * @param url The full URL of your webhook
   * @param params The POST parameters from the webhook
   */
  public validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, string>
  ): boolean {
    if (!this.authToken) {
      console.warn('[TwilioService] Cannot validate webhook signature without auth token');
      return false;
    }

    try {
      return twilio.validateRequest(this.authToken, signature, url, params);
    } catch (error) {
      console.error('[TwilioService] Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static reset(): void {
    TwilioService.instance = null;
  }
}

/**
 * Helper function to get Twilio client
 */
export function getTwilioClient(): Twilio {
  return TwilioService.getInstance().getClient();
}

/**
 * Helper function to check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return TwilioService.getInstance().isConfigured();
}
