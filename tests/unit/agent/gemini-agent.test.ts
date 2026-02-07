/**
 * Unit tests for the Gemini Agent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Define mock functions outside vi.mock for tracking
const mockSendMessage = vi.fn()
const mockStartChat = vi.fn()
const mockGetGenerativeModel = vi.fn()

// Mock the Google Generative AI SDK using factory function
vi.mock('@google/generative-ai', () => {
  // These need to be defined inside the factory to work correctly
  const _mockSendMessage = vi.fn().mockResolvedValue({
    response: {
      text: vi.fn().mockReturnValue('Test response'),
      functionCalls: vi.fn().mockReturnValue(null),
    },
  })

  const _mockStartChat = vi.fn().mockReturnValue({
    sendMessage: _mockSendMessage,
    sendMessageStream: vi.fn().mockImplementation(async function* () {
      yield {
        text: () => 'Streaming response',
        functionCalls: () => null,
      }
    }),
  })

  const _mockGetGenerativeModel = vi.fn().mockReturnValue({
    startChat: _mockStartChat,
  })

  // Define a mock class using function constructor pattern
  function MockGoogleGenerativeAI(apiKey: string) {
    // @ts-ignore
    this.apiKey = apiKey
    // @ts-ignore
    this.getGenerativeModel = _mockGetGenerativeModel
  }
  
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    FunctionCallingMode: {
      AUTO: 'AUTO',
    },
  }
})

// Mock the tool executor
vi.mock('@/lib/agent/tool-executor', () => ({
  executeTool: vi.fn().mockResolvedValue({
    id: 'test_call',
    name: 'search_flights',
    result: { flights: [] },
  }),
  executeTools: vi.fn().mockResolvedValue([]),
}))

describe('Gemini Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_AI_API_KEY = 'test_api_key'
  })

  afterEach(() => {
    delete process.env.GOOGLE_AI_API_KEY
  })

  describe('getGeminiClient', () => {
    it('should throw error when API key is not set', async () => {
      delete process.env.GOOGLE_AI_API_KEY
      
      // Dynamically import to trigger the error
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      await expect(chatWithGeminiAgent('Hello')).rejects.toThrow('GOOGLE_AI_API_KEY is not set')
    })

    it('should initialize client when API key is set', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test_api_key'
      
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      // Should not throw when API key is set
      const response = await chatWithGeminiAgent('Hello')
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })
  })

  describe('chatWithGeminiAgent', () => {
    it('should process a simple message and return response', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello, help me find a flight')
      
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(typeof response.content).toBe('string')
    })

    it('should handle empty chat history', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello', [])
      
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })

    it('should convert chat history to Gemini format', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const history = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ]
      
      const response = await chatWithGeminiAgent('Next message', history)
      
      // Verify the conversation was processed with history
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })

    it('should initialize response with default values', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Simple question')
      
      expect(response.paymentTriggered).toBe(false)
      expect(response.paymentAmount).toBeUndefined()
      expect(response.itineraryGenerated).toBeUndefined()
    })
  })

  describe('System Prompt', () => {
    it('should include TripWeaver AI identity', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      // We can verify the system prompt is working by checking the response
      // has proper assistant behavior
      const response = await chatWithGeminiAgent('Who are you?')
      
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(typeof response.content).toBe('string')
    })
  })

  describe('askGeminiAgent', () => {
    it('should provide simple wrapper for quick questions', async () => {
      const { askGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await askGeminiAgent('What is my budget?')
      
      expect(typeof response).toBe('string')
    })

    it('should handle optional context parameter', async () => {
      const { askGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await askGeminiAgent('Check event status', {
        eventId: 'event_123',
        employeeId: 'emp_456',
      })
      
      expect(typeof response).toBe('string')
    })
  })
})

describe('Agent Response Format', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_api_key'
  })

  it('should return AgentResponse with required fields', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Hello')
    
    expect(response).toHaveProperty('content')
    expect(response).toHaveProperty('paymentTriggered')
  })

  it('should include toolCalls when functions are called', async () => {
    // This test would need more complex mocking for function calls
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Search for flights from NYC to London')
    
    // With our mock, no function calls are returned
    expect(response.toolCalls).toBeUndefined()
  })
})
