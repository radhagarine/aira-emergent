// lib/types/database/wallet.types.ts

export type Currency = 'USD' | 'INR';

export interface WalletRow {
  id: string;
  user_id: string;
  balance_usd: number;
  balance_inr: number;
  currency: Currency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletInsert {
  id?: string;
  user_id: string;
  balance_usd?: number;
  balance_inr?: number;
  currency?: Currency;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WalletUpdate {
  balance_usd?: number;
  balance_inr?: number;
  currency?: Currency;
  is_active?: boolean;
  updated_at?: string;
}

export interface WalletBalance {
  usd: number;
  inr: number;
  primary_currency: Currency;
}
