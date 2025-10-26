// app/status/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /status
 * Twilio webhook handler for call status updates
 *
 * This endpoint receives status callbacks from Twilio during the lifecycle of a call
 * (initiated, ringing, answered, completed, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio status parameters
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const from = formData.get('From');
    const to = formData.get('To');
    const duration = formData.get('CallDuration');
    const timestamp = formData.get('Timestamp');

    console.log('[Status Webhook] Call status update:', {
      callSid,
      callStatus,
      from,
      to,
      duration,
      timestamp,
    });

    // TODO: Implement status tracking logic here
    // - Update call records in database
    // - Track call analytics
    // - Trigger notifications
    // - Update business metrics

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Status Webhook] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

/**
 * GET /status
 * Endpoint info for verification
 */
export async function GET() {
  return NextResponse.json({
    message: 'Call status webhook endpoint',
    method: 'POST',
    description: 'Receives call status callbacks from Twilio',
    url: '/status',
  });
}
