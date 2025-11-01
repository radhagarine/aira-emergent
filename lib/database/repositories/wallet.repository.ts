// lib/database/repositories/wallet.repository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IWalletRepository } from '../interfaces/wallet.interface';
import { WalletRow, WalletInsert, WalletUpdate, WalletBalance, Currency } from '@/lib/types/database/wallet.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

export class WalletRepository implements IWalletRepository {
  private readonly tableName = 'wallets';

  constructor(private readonly supabase: SupabaseClient) {}

  async getById(id: string): Promise<WalletRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(`Failed to get wallet by id ${id}`, error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting wallet', 'UNKNOWN', String(error));
    }
  }

  async getByUserId(userId: string): Promise<WalletRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(`Failed to get wallet for user ${userId}`, error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting wallet by user', 'UNKNOWN', String(error));
    }
  }

  async create(wallet: WalletInsert): Promise<WalletRow> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(wallet)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create wallet', error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error creating wallet', 'UNKNOWN', String(error));
    }
  }

  async update(id: string, data: WalletUpdate): Promise<WalletRow> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update wallet ${id}`, error.code, error.message);
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error updating wallet', 'UNKNOWN', String(error));
    }
  }

  async updateBalance(id: string, amount: number, currency: Currency, operation: 'add' | 'subtract'): Promise<WalletRow> {
    try {
      // Use atomic database function to prevent race conditions
      // Positive amounts for add, negative for subtract
      const adjustedAmount = operation === 'subtract' ? -amount : amount;

      const { data, error } = await this.supabase
        .rpc('update_wallet_balance_atomic', {
          p_wallet_id: id,
          p_amount: adjustedAmount,
          p_currency: currency
        });

      if (error) {
        // Parse specific error messages
        if (error.message?.includes('Insufficient balance')) {
          throw new DatabaseError('Insufficient balance', 'INSUFFICIENT_BALANCE', error.message);
        }
        if (error.message?.includes('Wallet not found')) {
          throw new DatabaseError('Wallet not found', 'NOT_FOUND', error.message);
        }
        if (error.message?.includes('Invalid currency')) {
          throw new DatabaseError('Invalid currency', 'INVALID_INPUT', error.message);
        }

        throw new DatabaseError('Failed to update wallet balance', error.code || 'UNKNOWN', error.message);
      }

      if (!data) {
        throw new DatabaseError('Wallet not found', 'NOT_FOUND', `Wallet ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error updating balance', 'UNKNOWN', String(error));
    }
  }

  async getBalance(id: string): Promise<WalletBalance> {
    try {
      const wallet = await this.getById(id);
      if (!wallet) {
        throw new DatabaseError('Wallet not found', 'NOT_FOUND', `Wallet ${id} not found`);
      }

      return {
        usd: wallet.balance_usd,
        inr: wallet.balance_inr,
        primary_currency: wallet.currency
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting balance', 'UNKNOWN', String(error));
    }
  }

  async deactivate(id: string): Promise<WalletRow> {
    try {
      return await this.update(id, {
        is_active: false,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error deactivating wallet', 'UNKNOWN', String(error));
    }
  }

  async hasSufficientBalance(userId: string, amount: number, currency: Currency): Promise<boolean> {
    try {
      const wallet = await this.getByUserId(userId);
      if (!wallet || !wallet.is_active) {
        return false;
      }

      const balance = currency === 'USD' ? wallet.balance_usd : wallet.balance_inr;
      return balance >= amount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }
}
