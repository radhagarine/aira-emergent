import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChatbotConversation,
  ChatbotMessage,
  CreateChatbotConversationInput,
  CreateChatbotMessageInput,
  UpdateChatbotConversationInput,
  ChatbotMessageRole
} from '@/lib/types/database/chatbot.types'
import { ChatbotConversationRepository } from '@/lib/database/repositories/chatbot-conversation.repository'
import { ChatbotMessageRepository } from '@/lib/database/repositories/chatbot-message.repository'

export interface SendMessageInput {
  sessionId: string
  message: string
  userId?: string | null
  businessId?: string | null
}

export interface ConversationWithMessages {
  conversation: ChatbotConversation
  messages: ChatbotMessage[]
}

export class ChatbotService {
  private conversationRepo: ChatbotConversationRepository
  private messageRepo: ChatbotMessageRepository

  constructor(private supabase: SupabaseClient) {
    this.conversationRepo = new ChatbotConversationRepository(supabase)
    this.messageRepo = new ChatbotMessageRepository(supabase)
  }

  /**
   * Get or create a conversation for a session
   */
  async getOrCreateConversation(
    sessionId: string,
    userId?: string | null,
    businessId?: string | null
  ): Promise<ChatbotConversation> {
    // Try to find existing conversation
    let conversation = await this.conversationRepo.findBySessionId(sessionId)

    if (!conversation) {
      // Create new conversation
      conversation = await this.conversationRepo.create({
        session_id: sessionId,
        user_id: userId,
        business_id: businessId,
        status: 'active'
      })
    }

    return conversation
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(input: SendMessageInput): Promise<{
    userMessage: ChatbotMessage
    botMessage: ChatbotMessage
  }> {
    const { sessionId, message, userId, businessId } = input

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(sessionId, userId, businessId)

    // Save user message
    const userMessage = await this.messageRepo.create({
      conversation_id: conversation.id,
      role: 'user',
      content: message
    })

    // Get conversation history for context
    const history = await this.messageRepo.findRecentMessages(conversation.id, 10)

    // Generate bot response
    const botResponse = this.generateResponse(message, history)

    // Save bot message
    const botMessage = await this.messageRepo.create({
      conversation_id: conversation.id,
      role: 'assistant',
      content: botResponse
    })

    return { userMessage, botMessage }
  }

  /**
   * Get conversation with all messages
   */
  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    const conversation = await this.conversationRepo.findById(conversationId)
    if (!conversation) return null

    const messages = await this.messageRepo.findByConversationId(conversationId)

    return { conversation, messages }
  }

  /**
   * Get conversation by session ID
   */
  async getConversationBySession(sessionId: string): Promise<ConversationWithMessages | null> {
    const conversation = await this.conversationRepo.findBySessionId(sessionId)
    if (!conversation) return null

    const messages = await this.messageRepo.findByConversationId(conversation.id)

    return { conversation, messages }
  }

  /**
   * Update conversation status (e.g., mark as resolved or escalated)
   */
  async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'resolved' | 'escalated'
  ): Promise<ChatbotConversation> {
    return this.conversationRepo.update(conversationId, { status })
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ChatbotConversation[]> {
    return this.conversationRepo.findByUserId(userId)
  }

  /**
   * Get all conversations for a business
   */
  async getBusinessConversations(businessId: string): Promise<ChatbotConversation[]> {
    return this.conversationRepo.findByBusinessId(businessId)
  }

  /**
   * Generate bot response based on user message and context
   * This is a simple implementation - can be replaced with actual AI/LLM integration
   */
  private generateResponse(message: string, history: ChatbotMessage[]): string {
    const lowerMessage = message.toLowerCase()

    // FAQ responses
    if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      return 'AiRA is an AI-powered reception assistant that handles calls, schedules appointments, and provides customer support 24/7. It uses advanced voice recognition and natural language processing to understand and respond to your customers. Would you like to know more about specific features?'
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      return 'Our pricing is designed to scale with your business:\n\n• Starter: $99/month - Up to 500 calls\n• Professional: $299/month - Up to 2,000 calls\n• Enterprise: Custom pricing - Unlimited calls\n\nAll plans include 24/7 support and basic integrations. Would you like me to connect you with our sales team for a detailed quote?'
    }

    if (lowerMessage.includes('demo') || lowerMessage.includes('try')) {
      return 'I\'d be happy to arrange a demo for you! You can:\n\n1. Schedule a live demo at: https://aira.aivn.ai/demo\n2. Try our interactive demo right now\n3. Provide your contact info and our team will reach out within 24 hours\n\nWhich option works best for you?'
    }

    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('technical')) {
      return 'For technical support, you can:\n\n• Email: support@aira.aivn.ai\n• Phone: +1 (555) 123-4567\n• Live Chat: Available on our website 24/7\n• Documentation: https://docs.aira.aivn.ai\n\nI\'m also here to help! What specific issue are you experiencing?'
    }

    if (lowerMessage.includes('feature') || lowerMessage.includes('capabilities') || lowerMessage.includes('can you')) {
      return 'AiRA offers powerful features:\n\n✓ 24/7 Phone Reception\n✓ Appointment Scheduling\n✓ Call Routing & Forwarding\n✓ Multi-language Support\n✓ CRM Integration\n✓ Custom Voice & Personality\n✓ Real-time Analytics\n✓ SMS & Email Follow-ups\n\nWhich feature interests you most?'
    }

    if (lowerMessage.includes('integrat') || lowerMessage.includes('connect')) {
      return 'AiRA integrates seamlessly with:\n\n• CRM: Salesforce, HubSpot, Zoho\n• Calendar: Google Calendar, Outlook, Calendly\n• Communication: Slack, Microsoft Teams\n• E-commerce: Shopify, WooCommerce\n• And many more via Zapier\n\nWhat system are you looking to integrate with?'
    }

    if (lowerMessage.includes('industry') || lowerMessage.includes('business type')) {
      return 'AiRA works great for various industries:\n\n• Healthcare & Medical Practices\n• Legal & Professional Services\n• Restaurants & Hospitality\n• Real Estate\n• Automotive Services\n• Salons & Spas\n• And many more!\n\nWhat industry is your business in?'
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! Great to meet you! I\'m AiRA, your AI reception assistant. I\'m here to help you learn about our platform and answer any questions. What would you like to know?'
    }

    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with today?'
    }

    // Default response
    return 'Thank you for your message! I\'m here to help you learn about AiRA. I can answer questions about:\n\n• How AiRA works\n• Pricing & plans\n• Features & capabilities\n• Integrations\n• Scheduling a demo\n\nWhat would you like to know more about?'
  }
}
