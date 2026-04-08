'use server'

import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { auth } from '@clerk/nextjs/server'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { chatWithGeminiAgent } from './agent/gemini-agent'
import type { AgentMessage } from './agent/types'
import type { EmployeeContext } from './agent/gemini-agent'
import type { DatabaseContext } from './agent/tool-executor'

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
 * Server action to chat with the Gemini agent.
 * Builds a real DatabaseContext using Convex fetchQuery/fetchMutation
 * authenticated with the user's Clerk → Convex session token.
 */
export async function chatWithAgent(
  userMessage: string,
  chatHistory: SerializedChatMessage[],
  employeeContext?: EmployeeContext,
  role?: 'admin' | 'employee'
): Promise<AgentResponse> {
  try {
    // Validate API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY is not set in environment variables')

      return {
        content: 'Configuration error: Google AI API key is not configured. Please ensure GOOGLE_AI_API_KEY is set in your environment variables. For Convex deployment, use: npx convex env set GOOGLE_AI_API_KEY <your-key>',
        paymentCompleted: false
      }
    }

    // Get Clerk → Convex auth token for authenticated DB queries
    const { getToken } = await auth()
    const token = (await getToken({ template: 'convex' })) ?? undefined

    if (!token && process.env.NODE_ENV === 'development') {
      console.warn('No Convex auth token — DB tool calls will fail. Check Clerk JWT template "convex" is configured.')
    }

    // Build DatabaseContext — all methods use the user's auth token
    const dbContext: DatabaseContext = {
      getEvent: async (eventId) => {
        try {
          return await fetchQuery(api.events.get, { id: eventId as Id<'events'> }, { token })
        } catch (e) {
          console.error('dbContext.getEvent failed:', e)
          return null
        }
      },

      getEmployee: async (employeeId) => {
        try {
          return await fetchQuery(api.employees.get, { id: employeeId as Id<'employees'> }, { token })
        } catch (e) {
          console.error('dbContext.getEmployee failed:', e)
          return null
        }
      },

      getTrip: async (tripId) => {
        try {
          return await fetchQuery(api.trips.get, { id: tripId as Id<'trips'> }, { token })
        } catch (e) {
          console.error('dbContext.getTrip failed:', e)
          return null
        }
      },

      listTrips: async ({ eventId, employeeId, status }) => {
        try {
          return await fetchQuery(
            api.trips.listFiltered,
            {
              eventId: eventId ? (eventId as Id<'events'>) : undefined,
              employeeId: employeeId ? (employeeId as Id<'employees'>) : undefined,
              status: status as "pending" | "generating" | "booked" | "in_progress" | "failed" | "completed" | "cancelled" | undefined,
            },
            { token }
          )
        } catch (e) {
          console.error('dbContext.listTrips failed:', e)
          return []
        }
      },

      updateTrip: async (tripId, data) => {
        try {
          const updateData = data as { status?: string; agentNotes?: string }
          if (updateData.status) {
            await fetchMutation(
              api.trips.updateStatus,
              {
                id: tripId as Id<'trips'>,
                status: updateData.status as "pending" | "generating" | "booked" | "in_progress" | "failed" | "completed" | "cancelled",
              },
              { token }
            )
          }
        } catch (e) {
          console.error('dbContext.updateTrip failed:', e)
        }
      },

      createItinerary: async (_data) => {
        // Itinerary creation via the agent is a best-effort operation.
        // The agent's text response (formatted itinerary) is still shown to the user
        // even if DB persistence fails. Full persistence added in a future phase.
        console.warn('createItinerary: DB persistence not yet wired — itinerary shown in chat only')
        return `itinerary_${Date.now()}`
      },
    }

    // Convert chat history to Gemini format
    const geminiHistory: AgentMessage[] = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp).getTime(),
    }))

    // Call the Gemini agent with full context
    const response = await chatWithGeminiAgent(
      userMessage,
      geminiHistory,
      dbContext,
      employeeContext,
      role
    )

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
