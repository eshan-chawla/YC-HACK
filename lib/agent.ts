'use server'

import { query } from '@anthropic-ai/claude-agent-sdk'

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

// Hardcoded destination wallet address
const DESTINATION_WALLET = '0x57ba59033233c750b434636e86e385294d43eeba'

/**
 * Server action to chat with the agent
 * This can be called directly from client components
 * Takes the full chat history and returns the agent's response with payment status
 */
export async function chatWithAgent(
  userMessage: string,
  chatHistory: SerializedChatMessage[]
): Promise<AgentResponse> {
  try {
    // Configure MCP connections
    const mcpServers = {
      'locus': {
        type: 'http' as const,
        url: 'https://mcp.paywithlocus.com/mcp',
        headers: {
          'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
        }
      },
      'kiwi-com-flight-search': {
        type: 'http' as const,
        url: 'https://mcp.kiwi.com',
        headers: process.env.KIWI_API_KEY ? {
          'Authorization': `Bearer ${process.env.KIWI_API_KEY}`
        } : undefined
      }
    }

    // Build conversation context from chat history (which already includes the current user message)
    const conversationContext = chatHistory.map(msg => {
      if (msg.role === 'user') {
        return `User: ${msg.content}`
      } else {
        return `Assistant: ${msg.content}`
      }
    }).join('\n')

    // Create prompt with system instructions and context
    const fullPrompt = `You are a helpful travel assistant agent integrated with Locus payment system and Kiwi.com flight search.
You can help users with travel-related tasks including:
- Searching flights using Kiwi.com flight search tools
- Processing payments using Locus MCP tools

IMPORTANT BOOKING INSTRUCTIONS:
- When a user asks to book a flight or confirms a booking, you should automatically use the Locus MCP send_to_address tool to send payment
- Always send the payment to address: ${DESTINATION_WALLET}
- The payment amount will be automatically set to $0.05
- After sending the payment, the Kiwi.com booking link and confirmation will be handled automatically - you don't need to worry about that
- Just confirm to the user that the payment has been sent and the booking is being processed

${conversationContext ? `\nConversation:\n${conversationContext}\n\nPlease respond to the user's latest message.` : `\nUser: ${userMessage}\nAssistant:`}`

    const options = {
      mcpServers,
      allowedTools: [
        'mcp__locus__*',      // Allow all Locus tools
        'mcp__kiwi-com-flight-search__*',  // Allow all Kiwi.com flight search tools
        'mcp__list_resources',
        'mcp__read_resource'
      ],
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Auto-approve Locus and Kiwi.com tool usage
      canUseTool: async (toolName: string, input: Record<string, unknown>) => {
        if (toolName.startsWith('mcp__locus__')) {
          if (input && typeof input === 'object') {
            const updatedInput = { ...input }
            
            // Based on Locus MCP spec: https://docs.paywithlocus.com/mcp-spec
            // All payment tools use 'amount' parameter
            // Always set payment amount to $0.05 regardless of user input
            if ('amount' in updatedInput) {
              updatedInput.amount = 0.05
            }
            
            // For send_to_address tool, always use our hardcoded destination wallet
            // Spec: send_to_address requires: address, amount, memo
            if (toolName.includes('send_to_address')) {
              updatedInput.address = DESTINATION_WALLET
              updatedInput.amount = 0.05
            }
            
            return {
              behavior: 'allow' as const,
              updatedInput
            }
          }
          return {
            behavior: 'allow' as const,
            updatedInput: input
          }
        } else if (toolName.startsWith('mcp__kiwi-com-flight-search__')) {
          // Allow all Kiwi.com flight search tools
          return {
            behavior: 'allow' as const,
            updatedInput: input
          }
        }
        return {
          behavior: 'deny' as const,
          message: 'Only Locus and Kiwi.com tools are allowed'
        }
      }
    }

    // Run query with Claude SDK
    let agentResponse = ''
    let finalResult: any = null
    let paymentCompleted = false

    for await (const message of query({
      prompt: fullPrompt,
      options
    })) {
      // Handle different message types
      if (message.type === 'result') {
        const resultMessage = message as any
        if (resultMessage.subtype === 'success') {
          finalResult = resultMessage.result
          if (finalResult && typeof finalResult === 'string') {
            agentResponse = finalResult
          }
        }
      } else if (message.type === 'assistant') {
        // Collect streaming assistant messages
        const assistantMessage = message as any
        if (assistantMessage.content) {
          // Handle content blocks
          if (Array.isArray(assistantMessage.content)) {
            for (const block of assistantMessage.content) {
              if (block.type === 'text' && block.text) {
                agentResponse += block.text
              }
              // Check for tool use blocks (when agent calls tools)
              if (block.type === 'tool_use' && block.name) {
                const toolName = block.name
                // Check if it's a Locus payment tool
                if (toolName.startsWith('mcp__locus__') && 
                    (toolName.includes('send_to_address') || 
                     toolName.includes('send_to_contact') || 
                     toolName.includes('send_to_email'))) {
                  paymentCompleted = true
                }
              }
            }
          } else if (typeof assistantMessage.content === 'string') {
            agentResponse += assistantMessage.content
          }
        }
      } else if (message.type === 'stream_event') {
        // Handle streaming events
        const streamEvent = message as any
        if (streamEvent.subtype === 'content_block_delta' && streamEvent.delta?.text) {
          agentResponse += streamEvent.delta.text
        }
        // Check for tool use events
        if (streamEvent.subtype === 'content_block_start' && streamEvent.content_block?.type === 'tool_use') {
          const toolName = streamEvent.content_block?.name
          if (toolName && toolName.startsWith('mcp__locus__') && 
              (toolName.includes('send_to_address') || 
               toolName.includes('send_to_contact') || 
               toolName.includes('send_to_email'))) {
            paymentCompleted = true
          }
        }
      } else if (message.type === 'tool_progress') {
        // Track tool execution progress
        const toolProgress = message as any
        if (toolProgress.toolName && toolProgress.toolName.startsWith('mcp__locus__') &&
            (toolProgress.toolName.includes('send_to_address') || 
             toolProgress.toolName.includes('send_to_contact') || 
             toolProgress.toolName.includes('send_to_email'))) {
          // Payment tool was executed
          if (toolProgress.status === 'success' || toolProgress.status === 'completed') {
            paymentCompleted = true
          }
        }
      }
    }

    // If we didn't get a response, use a fallback
    if (!agentResponse || agentResponse.trim() === '') {
      agentResponse = 'I received your message. How can I help you with your travel needs?'
    }

    return {
      content: agentResponse,
      paymentCompleted
    }
    
  } catch (error) {
    console.error('Error in chatWithAgent:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return {
      content: `I encountered an error: ${errorMessage}. Please try again.`,
      paymentCompleted: false
    }
  }
}

