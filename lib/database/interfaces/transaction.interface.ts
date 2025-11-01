// lib/database/interfaces/transaction.interface.ts

import {
  TransactionRow,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilter,
  TransactionSummary
} from '@/lib/types/database/transaction.types';

export interface ITransactionRepository {
  /**
   * Get transaction by ID
   */
  getById(id: string): Promise<TransactionRow | null>;

  /**
   * Get transactions by user ID with optional filters
   */
  getByUserId(userId: string, filter?: TransactionFilter): Promise<TransactionRow[]>;

  /**
   * Get transactions by wallet ID
   */
  getByWalletId(walletId: string, filter?: TransactionFilter): Promise<TransactionRow[]>;

  /**
   * Create a new transaction
   */
  create(transaction: TransactionInsert): Promise<TransactionRow>;

  /**
   * Update transaction (mainly for status updates)
   */
  update(id: string, data: TransactionUpdate): Promise<TransactionRow>;

  /**
   * Get transaction summary for a user
   */
  getSummary(userId: string, filter?: TransactionFilter): Promise<TransactionSummary>;

  /**
   * Get transaction by Stripe payment ID
   */
  getByStripePaymentId(paymentId: string): Promise<TransactionRow | null>;

  /**
   * Get transaction by Stripe checkout session ID
   */
  getByStripeCheckoutSessionId(sessionId: string): Promise<TransactionRow | null>;

  /**
   * Get recent transactions (paginated)
   */
  getRecent(userId: string, limit?: number, offset?: number): Promise<TransactionRow[]>;
}
