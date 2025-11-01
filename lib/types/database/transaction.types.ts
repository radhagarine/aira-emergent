// lib/types/database/transaction.types.ts

import { Currency } from './wallet.types';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface TransactionRow {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  status: TransactionStatus;
  payment_method: string | null;
  stripe_payment_id: string | null;
  stripe_checkout_session_id: string | null;
  metadata: Record<string, any>;
  business_number_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInsert {
  id?: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  status?: TransactionStatus;
  payment_method?: string | null;
  stripe_payment_id?: string | null;
  stripe_checkout_session_id?: string | null;
  metadata?: Record<string, any>;
  business_number_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionUpdate {
  status?: TransactionStatus;
  stripe_payment_id?: string | null;
  stripe_checkout_session_id?: string | null;
  metadata?: Record<string, any>;
  updated_at?: string;
}

export interface TransactionFilter {
  user_id?: string;
  wallet_id?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  currency?: Currency;
  start_date?: string;
  end_date?: string;
  business_number_id?: string;
}

export interface TransactionSummary {
  total_credits: number;
  total_debits: number;
  total_pending: number;
  net_amount: number;
  transaction_count: number;
}
