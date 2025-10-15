// app/api/wallet/add-test-funds/route.ts
// Temporary endpoint to add test funds for development

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, amount = 50 } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user by email
    const { data: users } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email);

    if (!users || users.length === 0) {
      // Try querying directly with RPC or service role
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const user = authUsers?.find((u: any) => u.email === email);

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userId = user.id;

      // Check if wallet exists
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingWallet) {
        // Update existing wallet
        const { data: updated, error } = await supabase
          .from('wallets')
          .update({
            balance_usd: existingWallet.balance_usd + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Added $${amount} to wallet`,
          wallet: updated,
          userId,
        });
      } else {
        // Create new wallet
        const { data: created, error } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance_usd: amount,
            balance_inr: 0,
            currency: 'USD',
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Created wallet with $${amount}`,
          wallet: created,
          userId,
        });
      }
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  } catch (error: any) {
    console.error('Error adding test funds:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add funds' },
      { status: 500 }
    );
  }
}
