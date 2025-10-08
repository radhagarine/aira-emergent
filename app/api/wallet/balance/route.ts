// app/api/wallet/balance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getWalletService } from '@/lib/services/service.factory';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
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

    // Get wallet balance
    const walletService = getWalletService();
    const wallet = await walletService.getWalletByUserId(user.id);

    if (!wallet) {
      // Return zero balances if wallet doesn't exist yet
      return NextResponse.json({
        balance_usd: 0,
        balance_inr: 0,
      });
    }

    return NextResponse.json({
      balance_usd: wallet.balance_usd || 0,
      balance_inr: wallet.balance_inr || 0,
      updated_at: wallet.updated_at,
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
