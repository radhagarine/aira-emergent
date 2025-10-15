// app/api/wallet/balance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('==================== WALLET BALANCE API CALLED ====================');
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

    // Get authenticated user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[Wallet Balance API] Session check - session:', !!session, 'error:', sessionError);

    if (sessionError || !session?.user) {
      // Return zero balance instead of error - wallet feature not fully implemented yet
      console.log('[Wallet Balance API] No session or error, returning 0 balance');
      return NextResponse.json({
        balance_usd: 0,
        balance_inr: 0,
      });
    }

    const userId = session.user.id;
    console.log('[Wallet Balance API] User ID:', userId);

    // Query wallet directly using supabase client
    // Note: wallets table may not exist yet - return zero if not found
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_usd, balance_inr, updated_at')
      .eq('user_id', userId)
      .single();

    console.log('[Wallet Balance API] Query result - data:', wallet, 'error:', walletError);

    if (walletError) {
      // If wallet doesn't exist or table doesn't exist, return zero balances
      console.log('Wallet query returned error (expected if table not created):', walletError.code, walletError.message);
      return NextResponse.json({
        balance_usd: 0,
        balance_inr: 0,
      });
    }

    return NextResponse.json({
      balance_usd: wallet?.balance_usd || 0,
      balance_inr: wallet?.balance_inr || 0,
      updated_at: wallet?.updated_at,
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
