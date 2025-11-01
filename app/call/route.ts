// app/call/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /call
 * Twilio webhook handler for incoming voice calls
 *
 * This endpoint receives incoming call webhooks from Twilio when someone
 * calls a phone number purchased through the system.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio call parameters
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    const to = formData.get('To');
    const callStatus = formData.get('CallStatus');

    console.log('[Call Webhook] Incoming call:', {
      callSid,
      from,
      to,
      callStatus,
    });

    // TODO: Implement your voice agent logic here
    // - Look up the business by phone number (To)
    // - Get the customer's voice agent configuration
    // - Connect to voice AI service (e.g., Vapi, Retell, etc.)
    // - Return appropriate TwiML response

    // For now, return a simple TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is AiRA voice assistant. Your voice agent configuration is not yet set up. Please configure your agent in the dashboard.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('[Call Webhook] Error:', error);

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we encountered an error processing your call. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

/**
 * GET /call
 * Endpoint info for verification
 */
export async function GET() {
  return NextResponse.json({
    message: 'Voice call webhook endpoint',
    method: 'POST',
    description: 'Receives incoming voice call webhooks from Twilio',
    url: '/call',
  });
}
