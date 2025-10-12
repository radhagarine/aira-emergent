export type ChatbotConversationStatus = 'active' | 'resolved' | 'escalated'
export type ChatbotMessageRole = 'user' | 'assistant' | 'system'

export interface ChatbotConversation {
  id: string
  session_id: string
  user_id?: string | null
  business_id?: string | null
  status: ChatbotConversationStatus
  created_at: string
  updated_at: string
}

export interface ChatbotMessage {
  id: string
  conversation_id: string
  role: ChatbotMessageRole
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CreateChatbotConversationInput {
  session_id: string
  user_id?: string | null
  business_id?: string | null
  status?: ChatbotConversationStatus
}

export interface CreateChatbotMessageInput {
  conversation_id: string
  role: ChatbotMessageRole
  content: string
  metadata?: Record<string, any>
}

export interface UpdateChatbotConversationInput {
  status?: ChatbotConversationStatus
  user_id?: string | null
  business_id?: string | null
}
