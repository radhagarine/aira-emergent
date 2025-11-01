import { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChatbotMessage,
  CreateChatbotMessageInput
} from '@/lib/types/database/chatbot.types'
import type { IChatbotMessageRepository } from '../interfaces/chatbot.interface'

export class ChatbotMessageRepository implements IChatbotMessageRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateChatbotMessageInput): Promise<ChatbotMessage> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .insert([input])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create chatbot message: ${error.message}`)
    }

    return data
  }

  async findById(id: string): Promise<ChatbotMessage | null> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find chatbot message: ${error.message}`)
    }

    return data
  }

  async findByConversationId(conversationId: string): Promise<ChatbotMessage[]> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to find messages by conversation: ${error.message}`)
    }

    return data || []
  }

  async findRecentMessages(conversationId: string, limit: number = 10): Promise<ChatbotMessage[]> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to find recent messages: ${error.message}`)
    }

    // Reverse to get chronological order
    return (data || []).reverse()
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('chatbot_messages')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete chatbot message: ${error.message}`)
    }
  }
}
