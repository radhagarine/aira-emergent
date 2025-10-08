// app/api/voice-agent/status/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/voice-agent/status
 * Webhook handler for call status updates from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio status parameters
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const callDuration = formData.get('CallDuration');
    const from = formData.get('From');
    const to = formData.get('To');

    console.log('[Status Webhook] Call status update:', {
      callSid,
      callStatus,
      callDuration,
      from,
      to,
    });

    // TODO: Implement status tracking logic here
    // - Store call logs in database
    // - Update analytics
    // - Trigger notifications if needed

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[Status Webhook] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

/**
 * GET /api/voice-agent/status
 * Endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Call status webhook endpoint',
    method: 'POST',
    description: 'Receives call status updates from Twilio',
  });
}
