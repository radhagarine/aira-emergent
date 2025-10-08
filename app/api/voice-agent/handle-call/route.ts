// app/api/voice-agent/handle-call/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/voice-agent/handle-call
 * Webhook handler for incoming voice calls from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio parameters
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    const to = formData.get('To');
    const callStatus = formData.get('CallStatus');

    console.log('[Voice Webhook] Incoming call:', {
      callSid,
      from,
      to,
      callStatus,
    });

    // TODO: Implement voice agent logic here
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
    console.error('[Voice Webhook] Error:', error);

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
 * GET /api/voice-agent/handle-call
 * Endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Voice call webhook endpoint',
    method: 'POST',
    description: 'Receives incoming voice call webhooks from Twilio',
  });
}
