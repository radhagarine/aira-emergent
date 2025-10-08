// lib/database/interfaces/wallet.interface.ts

import { WalletRow, WalletInsert, WalletUpdate, WalletBalance, Currency } from '@/lib/types/database/wallet.types';

export interface IWalletRepository {
  /**
   * Get wallet by ID
   */
  getById(id: string): Promise<WalletRow | null>;

  /**
   * Get wallet by user ID
   */
  getByUserId(userId: string): Promise<WalletRow | null>;

  /**
   * Create a new wallet
   */
  create(wallet: WalletInsert): Promise<WalletRow>;

  /**
   * Update wallet
   */
  update(id: string, data: WalletUpdate): Promise<WalletRow>;

  /**
   * Update balance (credit or debit)
   */
  updateBalance(id: string, amount: number, currency: Currency, operation: 'add' | 'subtract'): Promise<WalletRow>;

  /**
   * Get current balance
   */
  getBalance(id: string): Promise<WalletBalance>;

  /**
   * Deactivate wallet
   */
  deactivate(id: string): Promise<WalletRow>;

  /**
   * Check if user has sufficient balance
   */
  hasSufficientBalance(userId: string, amount: number, currency: Currency): Promise<boolean>;
}
