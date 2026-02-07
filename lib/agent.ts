'use server'

import { chatWithGeminiAgent, AgentMessage } from './agent/gemini-agent'

/**
 * Serialized chat message for server action response
 */
export interface SerializedChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: string // ISO string for serialization
  paymentCompleted?: boolean // Indicates if a payment was completed in this message
}

/**
 * Agent response with payment status
 */
export interface AgentResponse {
  content: string
  paymentCompleted: boolean
}

/**
 * Server action to chat with the Gemini agent
 * This can be called directly from client components
 * Takes the full chat history and returns the agent's response with payment status
 * 
 * Migrated from Anthropic SDK to Google Gemini 2.5 SDK
 */
export async function chatWithAgent(
  userMessage: string,
  chatHistory: SerializedChatMessage[]
): Promise<AgentResponse> {
  try {
    // Validate API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY is not set in environment variables')
      console.error('Set via Convex: npx convex env set GOOGLE_AI_API_KEY <your-key>')
      
      // Fallback to checking for the old Anthropic key for backward compatibility
      if (process.env.ANTHROPIC_API_KEY) {
        console.warn('Found ANTHROPIC_API_KEY but this agent now uses Google Gemini.')
        console.warn('Please set GOOGLE_AI_API_KEY for the new agent.')
      }
      
      return {
        content: 'Configuration error: Google AI API key is not configured. Please ensure GOOGLE_AI_API_KEY is set in your environment variables. For Convex deployment, use: npx convex env set GOOGLE_AI_API_KEY <your-key>',
        paymentCompleted: false
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('GOOGLE_AI_API_KEY is configured')
      console.log('Using Gemini 2.5 Pro model')
    }

    // Convert chat history to Gemini format
    const geminiHistory: AgentMessage[] = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp).getTime(),
    }))

    // Call the Gemini agent
    const response = await chatWithGeminiAgent(userMessage, geminiHistory)

    return {
      content: response.content,
      paymentCompleted: response.paymentTriggered ?? false
    }
    
  } catch (error) {
    console.error('Error in chatWithAgent:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    // Handle API key errors
    if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('GOOGLE_AI_API_KEY')) {
      return {
        content: 'Configuration error: API authentication issue. Please check your Google AI API key configuration.',
        paymentCompleted: false
      }
    }
    
    // Handle rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return {
        content: 'The AI service is temporarily rate limited. Please wait a moment and try again.',
        paymentCompleted: false
      }
    }
    
    // Generic error handling
    return {
      content: `I encountered an issue: ${errorMessage}. Please try again, or contact support if the problem persists.`,
      paymentCompleted: false
    }
  }
}

/**
 * Legacy export for backward compatibility
 * This is now handled by the Gemini agent internally
 */
export const DESTINATION_WALLET = '0x57ba59033233c750b434636e86e385294d43eeba'

