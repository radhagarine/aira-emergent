// app/api/wallet/add-test-funds/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { WalletService } from '@/lib/services/wallet/wallet.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wallet/add-test-funds
 * Add test funds to user's wallet for testing purposes
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { amount = 10.00 } = body; // Default to $10 for testing

    // Initialize services
    const repositoryFactory = RepositoryFactory.createWithClient(supabase);
    const walletService = new WalletService(repositoryFactory);

    // Add test funds
    const updatedWallet = await walletService.addFunds(user.id, amount, 'USD');

    return NextResponse.json({
      success: true,
      message: `Added $${amount.toFixed(2)} test funds to wallet`,
      wallet: {
        id: updatedWallet.id,
        balance_usd: updatedWallet.balance_usd,
        balance_inr: updatedWallet.balance_inr,
        currency: updatedWallet.currency
      }
    });

  } catch (error: any) {
    console.error('[Add Test Funds API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add test funds' },
      { status: 500 }
    );
  }
}