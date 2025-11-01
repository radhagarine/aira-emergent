// app/api/wallet/transactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Cookie setting can fail in middleware/server components
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Cookie removal can fail in middleware/server components
            }
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create repository factory with server-side Supabase client
    // IMPORTANT: Don't use singleton getInstance() in API routes - it uses client-side Supabase
    const { RepositoryFactory } = await import('@/lib/database/repository.factory');
    const repositoryFactory = RepositoryFactory.createWithClient(supabase);
    const transactionRepo = repositoryFactory.getTransactionRepository();

    // Get all transactions for user (already filtered by user_id)
    const allTransactions = await transactionRepo.getByUserId(user.id);

    // Limit and sort by most recent
    const transactions = allTransactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      date: tx.created_at,
      type: tx.type as 'credit' | 'debit',
      amount: parseFloat(tx.amount.toString()),
      description: tx.description || getDefaultDescription(tx),
      status: tx.status as 'completed' | 'pending' | 'failed',
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

function getDefaultDescription(transaction: any): string {
  if (transaction.type === 'credit') {
    if (transaction.stripe_checkout_session_id) {
      return `Wallet top-up via ${transaction.currency}`;
    }
    return 'Credit to wallet';
  } else {
    if (transaction.description?.includes('phone number')) {
      return transaction.description;
    }
    return 'Debit from wallet';
  }
}
