// app/api/voice-agent/handle-sms/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/voice-agent/handle-sms
 * Webhook handler for incoming SMS messages from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract Twilio parameters
    const messageSid = formData.get('MessageSid');
    const from = formData.get('From');
    const to = formData.get('To');
    const body = formData.get('Body');

    console.log('[SMS Webhook] Incoming message:', {
      messageSid,
      from,
      to,
      body,
    });

    // TODO: Implement SMS handler logic here
    // - Look up the business by phone number (To)
    // - Process the message
    // - Respond with appropriate TwiML

    // For now, return a simple auto-reply
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. This is an automated response from AiRA. We'll get back to you soon!</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('[SMS Webhook] Error:', error);

    return new NextResponse('', {
      status: 500,
    });
  }
}

/**
 * GET /api/voice-agent/handle-sms
 * Endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'SMS webhook endpoint',
    method: 'POST',
    description: 'Receives incoming SMS webhooks from Twilio',
  });
}
