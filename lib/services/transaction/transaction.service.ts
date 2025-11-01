// lib/services/transaction/transaction.service.ts

import { RepositoryFactory } from '@/lib/database/repository.factory';
import { ITransactionRepository } from '@/lib/database/interfaces/transaction.interface';
import { IWalletRepository } from '@/lib/database/interfaces/wallet.interface';
import { BaseService } from '@/lib/services/common/base.service';
import {
  TransactionRow,
  TransactionFilter,
  TransactionSummary,
  TransactionType,
  TransactionStatus
} from '@/lib/types/database/transaction.types';
import { Currency } from '@/lib/types/database/wallet.types';
import { ITransactionService } from './types';

export class TransactionService extends BaseService implements ITransactionService {
  private transactionRepository: ITransactionRepository;
  private walletRepository: IWalletRepository;

  constructor(repositoryFactory: RepositoryFactory) {
    super(repositoryFactory);
    this.transactionRepository = this.repositoryFactory.getTransactionRepository();
    this.walletRepository = this.repositoryFactory.getWalletRepository();
  }

  async createTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    currency: Currency,
    description: string,
    metadata?: Record<string, any>
  ): Promise<TransactionRow> {
    try {
      // Get or create wallet
      let wallet = await this.walletRepository.getByUserId(userId);
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await this.walletRepository.create({
          user_id: userId,
          balance_usd: 0,
          balance_inr: 0,
          currency: 'USD',
          is_active: true
        });
      }

      // Create transaction
      const transaction = await this.transactionRepository.create({
        user_id: userId,
        wallet_id: wallet.id,
        type,
        amount,
        currency,
        description,
        status: TransactionStatus.PENDING,
        metadata: metadata || {}
      });

      // Clear cache
      this.clearCache(`transactions_${userId}`);

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<TransactionRow | null> {
    try {
      const cacheKey = `transaction_${id}`;
      const cached = this.getFromCache<TransactionRow>(cacheKey);
      if (cached) return cached;

      const transaction = await this.transactionRepository.getById(id);

      if (transaction) {
        this.setCache(cacheKey, transaction, 600); // Cache for 10 minutes
      }

      return transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  async getTransactionHistory(userId: string, filter?: TransactionFilter): Promise<TransactionRow[]> {
    try {
      const transactions = await this.transactionRepository.getByUserId(userId, filter);
      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  async getTransactionSummary(userId: string, filter?: TransactionFilter): Promise<TransactionSummary> {
    try {
      const cacheKey = `transaction_summary_${userId}_${JSON.stringify(filter || {})}`;
      const cached = this.getFromCache<TransactionSummary>(cacheKey);
      if (cached) return cached;

      const summary = await this.transactionRepository.getSummary(userId, filter);

      this.setCache(cacheKey, summary, 300); // Cache for 5 minutes

      return summary;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<TransactionRow> {
    try {
      const transaction = await this.transactionRepository.update(id, {
        status,
        updated_at: new Date().toISOString()
      });

      // Clear cache
      this.clearCache(`transaction_${id}`);
      if (transaction) {
        this.clearCache(`transactions_${transaction.user_id}`);
      }

      return transaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  async createPhoneNumberPurchaseTransaction(
    userId: string,
    amount: number,
    currency: Currency,
    phoneNumberId: string
  ): Promise<TransactionRow> {
    try {
      // Get or create wallet
      let wallet = await this.walletRepository.getByUserId(userId);
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await this.walletRepository.create({
          user_id: userId,
          balance_usd: 0,
          balance_inr: 0,
          currency: 'USD',
          is_active: true
        });
      }

      // Create debit transaction for phone number purchase
      // Try to create transaction with business_number_id, fallback to null if it fails
      let transaction;
      try {
        transaction = await this.transactionRepository.create({
          user_id: userId,
          wallet_id: wallet.id,
          type: TransactionType.DEBIT,
          amount,
          currency,
          description: `Phone number purchase`,
          status: TransactionStatus.COMPLETED, // Immediately complete
          business_number_id: phoneNumberId,
          metadata: {
            type: 'phone_number_purchase',
            phone_number_id: phoneNumberId
          }
        });
      } catch (error) {
        console.warn('[TransactionService] Failed to create transaction with business_number_id, retrying without it:', error);
        // Retry without business_number_id if foreign key constraint fails
        transaction = await this.transactionRepository.create({
          user_id: userId,
          wallet_id: wallet.id,
          type: TransactionType.DEBIT,
          amount,
          currency,
          description: `Phone number purchase`,
          status: TransactionStatus.COMPLETED,
          business_number_id: null,
          metadata: {
            type: 'phone_number_purchase',
            phone_number_id: phoneNumberId
          }
        });
      }

      // Clear cache
      this.clearCache(`transactions_${userId}`);

      return transaction;
    } catch (error) {
      console.error('Error creating phone number purchase transaction:', error);
      throw error;
    }
  }

  async createRefundTransaction(
    userId: string,
    amount: number,
    currency: Currency,
    phoneNumberId: string,
    reason: string
  ): Promise<TransactionRow> {
    try {
      // Get wallet
      const wallet = await this.walletRepository.getByUserId(userId);
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      // Create credit transaction for refund
      let transaction;
      try {
        transaction = await this.transactionRepository.create({
          user_id: userId,
          wallet_id: wallet.id,
          type: TransactionType.CREDIT,
          amount,
          currency,
          description: `Refund: ${reason}`,
          status: TransactionStatus.COMPLETED,
          business_number_id: phoneNumberId,
          metadata: {
            type: 'refund',
            phone_number_id: phoneNumberId,
            reason
          }
        });
      } catch (error) {
        console.warn('[TransactionService] Failed to create refund transaction with business_number_id, retrying without it:', error);
        // Retry without business_number_id if foreign key constraint fails
        transaction = await this.transactionRepository.create({
          user_id: userId,
          wallet_id: wallet.id,
          type: TransactionType.CREDIT,
          amount,
          currency,
          description: `Refund: ${reason}`,
          status: TransactionStatus.COMPLETED,
          business_number_id: null,
          metadata: {
            type: 'refund',
            phone_number_id: phoneNumberId,
            reason
          }
        });
      }

      // Clear cache
      this.clearCache(`transactions_${userId}`);

      return transaction;
    } catch (error) {
      console.error('Error creating refund transaction:', error);
      throw error;
    }
  }

  async createStripePaymentTransaction(
    userId: string,
    amount: number,
    currency: Currency,
    stripeSessionId: string
  ): Promise<TransactionRow> {
    try {
      // Get wallet
      const wallet = await this.walletRepository.getByUserId(userId);
      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      // Create credit transaction for Stripe payment
      const transaction = await this.transactionRepository.create({
        user_id: userId,
        wallet_id: wallet.id,
        type: TransactionType.CREDIT,
        amount,
        currency,
        description: `Wallet top-up via Stripe`,
        status: TransactionStatus.PENDING, // Will be updated by webhook
        payment_method: 'stripe',
        stripe_checkout_session_id: stripeSessionId,
        metadata: {
          type: 'stripe_payment',
          stripe_session_id: stripeSessionId
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error creating Stripe payment transaction:', error);
      throw error;
    }
  }

  async getRecentTransactions(userId: string, limit: number = 10): Promise<TransactionRow[]> {
    try {
      const cacheKey = `recent_transactions_${userId}_${limit}`;
      const cached = this.getFromCache<TransactionRow[]>(cacheKey);
      if (cached) return cached;

      const transactions = await this.transactionRepository.getRecent(userId, limit);

      this.setCache(cacheKey, transactions, 300); // Cache for 5 minutes

      return transactions;
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }
}
