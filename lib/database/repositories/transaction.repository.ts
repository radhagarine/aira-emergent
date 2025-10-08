// lib/database/repositories/transaction.repository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { ITransactionRepository } from '../interfaces/transaction.interface';
import {
  TransactionRow,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilter,
  TransactionSummary,
  TransactionType,
  TransactionStatus
} from '@/lib/types/database/transaction.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

export class TransactionRepository implements ITransactionRepository {
  private readonly tableName = 'transactions';

  constructor(private readonly supabase: SupabaseClient) {}

  async getById(id: string): Promise<TransactionRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(`Failed to get transaction ${id}`, error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting transaction', 'UNKNOWN', String(error));
    }
  }

  async getByUserId(userId: string, filter?: TransactionFilter): Promise<TransactionRow[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filter) {
        if (filter.type) query = query.eq('type', filter.type);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.currency) query = query.eq('currency', filter.currency);
        if (filter.business_number_id) query = query.eq('business_number_id', filter.business_number_id);
        if (filter.start_date) query = query.gte('created_at', filter.start_date);
        if (filter.end_date) query = query.lte('created_at', filter.end_date);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to get transactions for user ${userId}`, error.code, error.message);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting transactions', 'UNKNOWN', String(error));
    }
  }

  async getByWalletId(walletId: string, filter?: TransactionFilter): Promise<TransactionRow[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('wallet_id', walletId);

      // Apply filters (same as getByUserId)
      if (filter) {
        if (filter.type) query = query.eq('type', filter.type);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.currency) query = query.eq('currency', filter.currency);
        if (filter.start_date) query = query.gte('created_at', filter.start_date);
        if (filter.end_date) query = query.lte('created_at', filter.end_date);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to get transactions for wallet ${walletId}`, error.code, error.message);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting wallet transactions', 'UNKNOWN', String(error));
    }
  }

  async create(transaction: TransactionInsert): Promise<TransactionRow> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(transaction)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create transaction', error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error creating transaction', 'UNKNOWN', String(error));
    }
  }

  async update(id: string, data: TransactionUpdate): Promise<TransactionRow> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update transaction ${id}`, error.code, error.message);
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error updating transaction', 'UNKNOWN', String(error));
    }
  }

  async getSummary(userId: string, filter?: TransactionFilter): Promise<TransactionSummary> {
    try {
      const transactions = await this.getByUserId(userId, filter);

      const summary: TransactionSummary = {
        total_credits: 0,
        total_debits: 0,
        total_pending: 0,
        net_amount: 0,
        transaction_count: transactions.length
      };

      transactions.forEach(tx => {
        if (tx.status === TransactionStatus.COMPLETED) {
          if (tx.type === TransactionType.CREDIT) {
            summary.total_credits += tx.amount;
          } else if (tx.type === TransactionType.DEBIT) {
            summary.total_debits += tx.amount;
          }
        } else if (tx.status === TransactionStatus.PENDING) {
          summary.total_pending += tx.amount;
        }
      });

      summary.net_amount = summary.total_credits - summary.total_debits;

      return summary;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error calculating summary', 'UNKNOWN', String(error));
    }
  }

  async getByStripePaymentId(paymentId: string): Promise<TransactionRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('stripe_payment_id', paymentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(`Failed to get transaction by payment ID`, error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting transaction by payment ID', 'UNKNOWN', String(error));
    }
  }

  async getByStripeCheckoutSessionId(sessionId: string): Promise<TransactionRow | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(`Failed to get transaction by session ID`, error.code, error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting transaction by session ID', 'UNKNOWN', String(error));
    }
  }

  async getRecent(userId: string, limit: number = 10, offset: number = 0): Promise<TransactionRow[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to get recent transactions`, error.code, error.message);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Unexpected error getting recent transactions', 'UNKNOWN', String(error));
    }
  }
}
