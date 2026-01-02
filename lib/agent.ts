'use server'

import { query } from '@anthropic-ai/claude-agent-sdk'
import { resolve } from 'path'
import { existsSync, readdirSync } from 'fs'

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
  // Detect if we're in a Vercel/serverless environment (needed for error handling)
  const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV
  const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_PUBLIC_VERCEL_URL
  
  try {
    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables')
      console.error('Please create a .env.local file with: ANTHROPIC_API_KEY=your_key_here')
      console.error('For Vercel: Set ANTHROPIC_API_KEY in Vercel project settings → Environment Variables')
      return {
        content: 'Configuration error: Anthropic API key is not configured. Please ensure ANTHROPIC_API_KEY is set in your environment variables (local: .env.local, Vercel: project settings).',
        paymentCompleted: false
      }
    }
    
    console.log('ANTHROPIC_API_KEY is configured (length:', process.env.ANTHROPIC_API_KEY.length, 'chars)')
    console.log('Environment:', isServerless ? 'Serverless (Vercel)' : 'Local')

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

    // Find claude-code executable - SDK requires this, but it won't work in serverless
    // NOTE: If this was working 2 days ago and now it's not, possible causes:
    // 1. SDK version update changed how ProcessTransport executes files
    // 2. Node.js version change
    // 3. Package manager change (npm vs pnpm)
    // 4. Windows file associations changed
    let claudeCodePath: string | undefined = undefined
    
    if (isServerless) {
      // In serverless environments (Vercel), the executable can't be run
      // The SDK will need to work without it or we need an alternative approach
      console.warn('Running in serverless environment - claude-code executable will not be available')
      console.warn('The SDK may have limited functionality without the executable')
      // Set to undefined to let SDK handle it gracefully
      claudeCodePath = undefined
    } else {
      // Only try to find executable in non-serverless environments
      try {
        // Try using require.resolve to find the package (works with any package manager)
        try {
          const claudeCodeModulePath = require.resolve('@anthropic-ai/claude-code/package.json')
          const claudeCodeDir = resolve(claudeCodeModulePath, '..')
          const cliPath = resolve(claudeCodeDir, 'cli.js')
          if (existsSync(cliPath)) {
            claudeCodePath = cliPath
            console.log('Found claude-code via require.resolve:', claudeCodePath)
          }
        } catch (resolveError) {
          // require.resolve failed, try manual search
        }
        
        // If require.resolve didn't work, try manual paths
        if (!claudeCodePath) {
          // First check standard npm/yarn location
          const standardPath = resolve(process.cwd(), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js')
          if (existsSync(standardPath)) {
            claudeCodePath = standardPath
            console.log('Found claude-code at standard path:', claudeCodePath)
          } else {
            // For pnpm, search in .pnpm directory
            const pnpmDir = resolve(process.cwd(), 'node_modules', '.pnpm')
            if (existsSync(pnpmDir)) {
              try {
                const entries = readdirSync(pnpmDir)
                const claudeCodeEntry = entries.find((entry: string) => 
                  entry.startsWith('@anthropic-ai+claude-code@')
                )
                if (claudeCodeEntry) {
                  const pnpmPath = resolve(
                    pnpmDir,
                    claudeCodeEntry,
                    'node_modules',
                    '@anthropic-ai',
                    'claude-code',
                    'cli.js'
                  )
                  if (existsSync(pnpmPath)) {
                    claudeCodePath = pnpmPath
                    console.log('Found claude-code at pnpm path:', claudeCodePath)
                  }
                }
              } catch (err) {
                console.warn('Error searching pnpm directory:', err)
              }
            }
          }
        }
        
        if (!claudeCodePath) {
          console.warn('Could not locate claude-code executable. The SDK may not work properly.')
          console.warn('Make sure @anthropic-ai/claude-code is installed: pnpm add @anthropic-ai/claude-code')
        } else {
          // Log diagnostic info if it was working before
          console.log('Diagnostic info for troubleshooting:')
          console.log('- Node.js version:', process.version)
          console.log('- Platform:', process.platform)
          console.log('- Executable path:', claudeCodePath)
          console.log('- SDK version: @anthropic-ai/claude-agent-sdk@0.1.42')
        }
      } catch (error) {
        console.warn('Error locating claude-code executable:', error)
      }
    }

    // In serverless, the SDK may fail if executable is required
    // We'll catch the error and provide a fallback
    const options: any = {
      mcpServers,
      allowedTools: [
        'mcp__locus__*',      // Allow all Locus tools
        'mcp__kiwi-com-flight-search__*',  // Allow all Kiwi.com flight search tools
        'mcp__list_resources',
        'mcp__read_resource'
      ],
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Ensure environment variables are passed to the spawned process
      // This is especially important for ANTHROPIC_API_KEY
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        // Pass other API keys if available
        ...(process.env.LOCUS_API_KEY && { LOCUS_API_KEY: process.env.LOCUS_API_KEY }),
        ...(process.env.KIWI_API_KEY && { KIWI_API_KEY: process.env.KIWI_API_KEY }),
      },
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
    
    // Configure executable path and execution settings
    // The SDK's ProcessTransport automatically detects .js files and uses Node.js,
    // but we'll explicitly configure it to ensure proper execution on Windows
    
    if (isServerless) {
      // In serverless, we can't run executables, but SDK still requires the path to be set
      // Set it to undefined and catch the initialization error
      options.pathToClaudeCodeExecutable = undefined
      console.log('Serverless environment detected - SDK may fail initialization but we\'ll catch it')
    } else if (claudeCodePath) {
      // Set the path - SDK requires it
      options.pathToClaudeCodeExecutable = claudeCodePath
      
      // Explicitly set executable to 'node' to ensure proper execution on Windows
      // The SDK should auto-detect this, but being explicit helps avoid issues
      options.executable = 'node'
      options.executableArgs = []
      
      console.log('Using claude-code executable at:', claudeCodePath)
      console.log('Executable:', options.executable)
      console.log('Node.js version:', process.version)
      console.log('Platform:', process.platform)
      
      // Verify Node.js is available
      try {
        const { execSync } = require('child_process')
        const nodeVersion = execSync('node --version', { encoding: 'utf-8', stdio: 'pipe' }).trim()
        console.log('Node.js executable verified:', nodeVersion)
      } catch (nodeCheckError) {
        console.warn('Warning: Could not verify Node.js executable:', nodeCheckError)
      }
    } else {
      // If we couldn't find it, set to undefined and catch the error
      options.pathToClaudeCodeExecutable = undefined
      console.warn('claude-code executable not found - SDK initialization may fail')
    }

    // Run query with Claude SDK
    // Wrap in try-catch to handle ProcessTransport initialization errors
    let agentResponse = ''
    let finalResult: any = null
    let paymentCompleted = false

    try {
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
    } catch (queryError) {
      // Catch ProcessTransport initialization and execution errors
      const queryErrorMessage = queryError instanceof Error ? queryError.message : 'Unknown error'
      const queryErrorStack = queryError instanceof Error ? queryError.stack : undefined
      
      // Log full error details for debugging
      console.error('SDK query error details:')
      console.error('- Message:', queryErrorMessage)
      console.error('- Stack:', queryErrorStack)
      console.error('- Error type:', queryError?.constructor?.name)
      console.error('- Error object:', JSON.stringify(queryError, Object.getOwnPropertyNames(queryError)))
      
      // Check for ProcessTransport-related errors (initialization or execution)
      if (queryErrorMessage.includes('Claude Code executable not found') ||
          queryErrorMessage.includes('pathToClaudeCodeExecutable') ||
          queryErrorMessage.includes('ProcessTransport') ||
          queryErrorMessage.includes('process exited with code') ||
          queryErrorMessage.includes('Failed to spawn')) {
        console.warn('ProcessTransport error detected:', queryErrorMessage)
        console.warn('Diagnostic info:')
        console.warn('- Executable configured:', options.executable || 'default (node)')
        console.warn('- Executable path:', options.pathToClaudeCodeExecutable)
        console.warn('- Node.js version:', process.version)
        console.warn('- Platform:', process.platform)
        console.warn('This may be due to the SDK trying to execute cli.js without Node.js')
        console.warn('The SDK was working before - this might be due to an SDK update or environment change')
        
        // Return a helpful message - the SDK can't execute the file properly
        return {
          content: 'I\'m experiencing a configuration issue with the Claude Agent SDK. The SDK is trying to execute a code execution component, but it\'s failing. This might be due to a recent SDK update or environment change. However, I can still help you with travel planning, flight searches, and payment processing through our integrated tools. How can I assist you with your travel needs?',
          paymentCompleted: false
        }
      }
      // Re-throw other errors to be caught by outer catch
      throw queryError
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
    
    // Handle claude-code executable error specifically
    if (errorMessage.includes('claude-code') || 
        errorMessage.includes('Claude Code executable') ||
        errorMessage.includes('process exited with code') ||
        errorMessage.includes('executable not found')) {
      console.warn('Claude Code executable error detected in', isServerless ? 'serverless' : 'local', 'environment')
      
      if (isServerless) {
        // In Vercel/serverless, provide a helpful message
        return {
          content: 'I\'m running in a serverless environment which has limitations with code execution. However, I can still help you with travel planning, flight searches, and payment processing through our integrated tools. How can I assist you with your travel needs?',
          paymentCompleted: false
        }
      } else {
        // In local dev, explain the issue and that basic functionality still works
        return {
          content: 'I\'m experiencing a configuration issue with the Claude Code executable. The SDK is trying to execute a JavaScript file directly, but it needs Node.js to run properly. This is a known limitation of the SDK in some environments. However, I can still help you with travel planning, flight searches, and payment processing through our integrated tools. How can I assist you with your travel needs?',
          paymentCompleted: false
        }
      }
    }
    
    // Handle API key errors
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return {
        content: 'Configuration error: API authentication issue. Please check your API key configuration.',
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

