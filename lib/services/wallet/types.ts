// lib/services/wallet/types.ts

import { WalletRow, WalletBalance, Currency } from '@/lib/types/database/wallet.types';

export interface IWalletService {
  /**
   * Get or create wallet for user
   */
  getOrCreateWallet(userId: string): Promise<WalletRow>;

  /**
   * Get wallet balance
   */
  getBalance(userId: string): Promise<WalletBalance>;

  /**
   * Check if user has sufficient balance
   */
  hasSufficientBalance(userId: string, amount: number, currency: Currency): Promise<boolean>;

  /**
   * Add funds to wallet (used by payment webhook)
   */
  addFunds(userId: string, amount: number, currency: Currency): Promise<WalletRow>;

  /**
   * Deduct funds from wallet (used for purchases)
   */
  deductFunds(userId: string, amount: number, currency: Currency, description: string): Promise<WalletRow>;

  /**
   * Get wallet by user ID
   */
  getWalletByUserId(userId: string): Promise<WalletRow | null>;
}
