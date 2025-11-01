// lib/services/wallet/wallet.service.ts

import { RepositoryFactory } from '@/lib/database/repository.factory';
import { IWalletRepository } from '@/lib/database/interfaces/wallet.interface';
import { ITransactionRepository } from '@/lib/database/interfaces/transaction.interface';
import { BaseService } from '@/lib/services/common/base.service';
import { WalletRow, WalletBalance, Currency } from '@/lib/types/database/wallet.types';
import { TransactionType, TransactionStatus } from '@/lib/types/database/transaction.types';
import { IWalletService } from './types';

export class WalletService extends BaseService implements IWalletService {
  private walletRepository: IWalletRepository;
  private transactionRepository: ITransactionRepository;

  constructor(repositoryFactory: RepositoryFactory) {
    super(repositoryFactory);
    this.walletRepository = this.repositoryFactory.getWalletRepository();
    this.transactionRepository = this.repositoryFactory.getTransactionRepository();
  }

  async getOrCreateWallet(userId: string): Promise<WalletRow> {
    try {
      // Try to get existing wallet
      let wallet = await this.walletRepository.getByUserId(userId);

      // If not found, create one
      if (!wallet) {
        wallet = await this.walletRepository.create({
          user_id: userId,
          balance_usd: 0,
          balance_inr: 0,
          currency: 'USD',
          is_active: true
        });
      }

      return wallet;
    } catch (error) {
      console.error('Error getting or creating wallet:', error);
      throw error;
    }
  }

  async getBalance(userId: string): Promise<WalletBalance> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      return {
        usd: wallet.balance_usd,
        inr: wallet.balance_inr,
        primary_currency: wallet.currency
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async hasSufficientBalance(userId: string, amount: number, currency: Currency): Promise<boolean> {
    try {
      return await this.walletRepository.hasSufficientBalance(userId, amount, currency);
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  async addFunds(userId: string, amount: number, currency: Currency): Promise<WalletRow> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Update balance
      const updatedWallet = await this.walletRepository.updateBalance(
        wallet.id,
        amount,
        currency,
        'add'
      );

      // Clear cache
      this.clearCache(`wallet_${userId}`);
      this.clearCache(`balance_${userId}`);

      return updatedWallet;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  async deductFunds(userId: string, amount: number, currency: Currency, description: string): Promise<WalletRow> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Check sufficient balance
      const hasFunds = await this.hasSufficientBalance(userId, amount, currency);
      if (!hasFunds) {
        throw new Error(`Insufficient balance. Required: ${amount} ${currency}`);
      }

      // Update balance
      const updatedWallet = await this.walletRepository.updateBalance(
        wallet.id,
        amount,
        currency,
        'subtract'
      );

      // Clear cache
      this.clearCache(`wallet_${userId}`);
      this.clearCache(`balance_${userId}`);

      return updatedWallet;
    } catch (error) {
      console.error('Error deducting funds:', error);
      throw error;
    }
  }

  async getWalletByUserId(userId: string): Promise<WalletRow | null> {
    try {
      // Check cache first
      const cacheKey = `wallet_${userId}`;
      const cached = this.getFromCache<WalletRow>(cacheKey);
      if (cached) return cached;

      // Get from repository
      const wallet = await this.walletRepository.getByUserId(userId);

      if (wallet) {
        this.setCache(cacheKey, wallet, 300); // Cache for 5 minutes
      }

      return wallet;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }
}
