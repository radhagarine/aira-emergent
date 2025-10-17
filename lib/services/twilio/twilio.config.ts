// lib/services/twilio/twilio.config.ts

/**
 * Twilio Service Configuration
 *
 * IMPORTANT: Set TWILIO_TESTING_MODE to control real vs mock API calls
 * - true: Mock mode - No money charged, fake responses (SAFE FOR TESTING)
 * - false: Production mode - Real Twilio API calls (CHARGES MONEY)
 */

export const TwilioConfig = {
  /**
   * TESTING MODE
   *
   * Set to TRUE to enable testing mode (no real Twilio API calls, no charges)
   * Set to FALSE to enable production mode (real Twilio API calls, charges apply)
   *
   * Can also be controlled via environment variable:
   * TWILIO_TESTING_MODE=true (testing)
   * TWILIO_TESTING_MODE=false (production)
   */
  TESTING_MODE: process.env.TWILIO_TESTING_MODE === 'true' || true, // Default: true (safe)

  /**
   * Check if we're in testing mode
   */
  isTestingMode(): boolean {
    return this.TESTING_MODE;
  },

  /**
   * Check if we're in production mode
   */
  isProductionMode(): boolean {
    return !this.TESTING_MODE;
  },

  /**
   * Log current mode on startup
   */
  logMode(): void {
    if (this.isTestingMode()) {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  TWILIO TESTING MODE ENABLED                                   ║');
      console.log('║  All Twilio API calls are MOCKED - No charges will be applied ║');
      console.log('║  To enable production mode, set TWILIO_TESTING_MODE=false      ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
    } else {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  ⚠️  TWILIO PRODUCTION MODE ENABLED  ⚠️                        ║');
      console.log('║  Real Twilio API calls - CHARGES WILL BE APPLIED              ║');
      console.log('║  To enable testing mode, set TWILIO_TESTING_MODE=true         ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
    }
  },
} as const;

// Log mode on module load
TwilioConfig.logMode();
