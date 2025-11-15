'use server'

import { getChatHistory, type ChatMessage } from './chat-history'

/**
 * Serialized chat message for server action response
 */
export interface SerializedChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: string // ISO string for serialization
}

/**
 * Server action to chat with the agent
 * This can be called directly from client components
 * Returns the full chat history after processing the message
 */
export async function chatWithAgent(userMessage: string): Promise<SerializedChatMessage[]> {
  const chatHistory = getChatHistory()
  
  // Add user message to history
  chatHistory.addMessage('user', userMessage)
  
  // TODO: Implement actual agent logic here
  // For now, just return a stub response
  const agentResponse = `Agent received: "${userMessage}". This is a stub response.`
  
  // Add agent response to history
  chatHistory.addMessage('agent', agentResponse)
  
  // Return the full chat history with serialized dates
  return chatHistory.getMessages().map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }))
}

