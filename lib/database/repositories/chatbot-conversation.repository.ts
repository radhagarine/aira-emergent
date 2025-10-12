import { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChatbotConversation,
  CreateChatbotConversationInput,
  UpdateChatbotConversationInput
} from '@/lib/types/database/chatbot.types'
import type { IChatbotConversationRepository } from '../interfaces/chatbot.interface'

export class ChatbotConversationRepository implements IChatbotConversationRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateChatbotConversationInput): Promise<ChatbotConversation> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .insert([input])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create chatbot conversation: ${error.message}`)
    }

    return data
  }

  async findById(id: string): Promise<ChatbotConversation | null> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find chatbot conversation: ${error.message}`)
    }

    return data
  }

  async findBySessionId(sessionId: string): Promise<ChatbotConversation | null> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find chatbot conversation by session: ${error.message}`)
    }

    return data
  }

  async findByUserId(userId: string): Promise<ChatbotConversation[]> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find conversations by user: ${error.message}`)
    }

    return data || []
  }

  async findByBusinessId(businessId: string): Promise<ChatbotConversation[]> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find conversations by business: ${error.message}`)
    }

    return data || []
  }

  async update(id: string, input: UpdateChatbotConversationInput): Promise<ChatbotConversation> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update chatbot conversation: ${error.message}`)
    }

    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('chatbot_conversations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete chatbot conversation: ${error.message}`)
    }
  }
}
