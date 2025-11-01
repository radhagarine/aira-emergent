// lib/services/transaction/types.ts

import {
  TransactionRow,
  TransactionFilter,
  TransactionSummary,
  TransactionType,
  TransactionStatus
} from '@/lib/types/database/transaction.types';
import { Currency } from '@/lib/types/database/wallet.types';

export interface ITransactionService {
  /**
   * Create a new transaction
   */
  createTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    currency: Currency,
    description: string,
    metadata?: Record<string, any>
  ): Promise<TransactionRow>;

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Promise<TransactionRow | null>;

  /**
   * Get user's transaction history
   */
  getTransactionHistory(userId: string, filter?: TransactionFilter): Promise<TransactionRow[]>;

  /**
   * Get transaction summary
   */
  getTransactionSummary(userId: string, filter?: TransactionFilter): Promise<TransactionSummary>;

  /**
   * Update transaction status
   */
  updateTransactionStatus(id: string, status: TransactionStatus): Promise<TransactionRow>;

  /**
   * Create transaction for phone number purchase
   */
  createPhoneNumberPurchaseTransaction(
    userId: string,
    amount: number,
    currency: Currency,
    phoneNumberId: string
  ): Promise<TransactionRow>;

  /**
   * Create transaction for Stripe payment
   */
  createStripePaymentTransaction(
    userId: string,
    amount: number,
    currency: Currency,
    stripeSessionId: string
  ): Promise<TransactionRow>;

  /**
   * Get recent transactions
   */
  getRecentTransactions(userId: string, limit?: number): Promise<TransactionRow[]>;
}
