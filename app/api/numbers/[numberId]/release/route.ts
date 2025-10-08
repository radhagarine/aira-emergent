// app/api/numbers/[numberId]/release/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTwilioNumbersService } from '@/lib/services/twilio';
import { RepositoryFactory } from '@/lib/database/repository.factory';
import { BusinessNumbersService } from '@/lib/services/numbers/business-numbers.service';

export const runtime = 'nodejs';

/**
 * DELETE /api/numbers/[numberId]/release
 * Release/delete a phone number
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ numberId: string }> }
) {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Database configuration missing' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { numberId } = await params;

  try {
    // Initialize services
    const repositoryFactory = RepositoryFactory.createWithClient(supabase);
    const businessNumbersService = new BusinessNumbersService(repositoryFactory);
    const twilioService = getTwilioNumbersService();

    // Get number from database
    const number = await businessNumbersService.getNumberById(numberId);

    if (!number) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Release from Twilio if it has a Twilio SID
    if (number.twilio_sid) {
      try {
        await twilioService.releaseNumber(number.twilio_sid);
      } catch (error: any) {
        // Log error but continue - number might already be deleted in Twilio
        console.warn(`[API /api/numbers/${numberId}/release] Failed to release from Twilio:`, error);
      }
    }

    // Delete from database
    await businessNumbersService.deleteNumber(numberId);

    return NextResponse.json({
      success: true,
      message: 'Phone number released successfully',
    });
  } catch (error: any) {
    console.error(`[API /api/numbers/${numberId}/release] Error:`, error);

    // Handle specific errors
    if (error.message?.includes('Cannot delete primary number')) {
      return NextResponse.json(
        {
          error: 'Cannot delete primary number. Please set another number as primary first.',
          code: 'PRIMARY_NUMBER_DELETE',
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Phone number not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to release phone number',
        code: 'RELEASE_FAILED',
      },
      { status: 500 }
    );
  }
}
