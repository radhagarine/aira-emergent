import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ChatbotService } from '@/lib/services/chatbot/chatbot.service'

export const runtime = 'nodejs'

interface ChatRequest {
  message: string
  sessionId?: string
  userId?: string | null
  businessId?: string | null
}

// Generate a session ID if not provided
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Chatbot API] Received request')

    const body: ChatRequest = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      console.error('[Chatbot API] Invalid message in request body')
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Chatbot API] Supabase configuration missing')
      throw new Error('Supabase configuration missing')
    }

    console.log('[Chatbot API] Creating Supabase client')
    const supabase = createClient(supabaseUrl, supabaseKey)
    const chatbotService = new ChatbotService(supabase)

    // Generate session ID if not provided
    const sessionId = body.sessionId || generateSessionId()

    // Send message and get response
    const { userMessage, botMessage } = await chatbotService.sendMessage({
      sessionId,
      message: body.message,
      userId: body.userId,
      businessId: body.businessId
    })

    console.log('[Chatbot API] Message processed successfully')
    return NextResponse.json({
      message: botMessage.content,
      sessionId,
      conversationId: botMessage.conversation_id,
      timestamp: botMessage.created_at
    })
  } catch (error: any) {
    console.error('[Chatbot API] Error:', error)

    // Log more details about the error
    if (error.cause) {
      console.error('[Chatbot API] Error cause:', error.cause)
    }

    // Check if it's a Supabase connection error
    if (error.code === 'UND_ERR_SOCKET' || error.message?.includes('fetch failed')) {
      console.error('[Chatbot API] Socket/fetch error - possible Supabase connection issue')
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
