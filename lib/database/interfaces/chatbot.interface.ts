import type {
  ChatbotConversation,
  ChatbotMessage,
  CreateChatbotConversationInput,
  CreateChatbotMessageInput,
  UpdateChatbotConversationInput
} from '@/lib/types/database/chatbot.types'

export interface IChatbotConversationRepository {
  // Conversation CRUD operations
  create(input: CreateChatbotConversationInput): Promise<ChatbotConversation>
  findById(id: string): Promise<ChatbotConversation | null>
  findBySessionId(sessionId: string): Promise<ChatbotConversation | null>
  findByUserId(userId: string): Promise<ChatbotConversation[]>
  findByBusinessId(businessId: string): Promise<ChatbotConversation[]>
  update(id: string, input: UpdateChatbotConversationInput): Promise<ChatbotConversation>
  delete(id: string): Promise<void>
}

export interface IChatbotMessageRepository {
  // Message CRUD operations
  create(input: CreateChatbotMessageInput): Promise<ChatbotMessage>
  findById(id: string): Promise<ChatbotMessage | null>
  findByConversationId(conversationId: string): Promise<ChatbotMessage[]>
  findRecentMessages(conversationId: string, limit?: number): Promise<ChatbotMessage[]>
  delete(id: string): Promise<void>
}
