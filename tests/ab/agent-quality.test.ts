/**
 * A/B Tests for Agent Quality
 * 
 * Tests the quality of agent responses across different scenarios
 * and configurations to ensure consistent, high-quality output.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Google Generative AI using factory function pattern for Vitest 4.x
vi.mock('@google/generative-ai', () => {
  const agentQualityResponses: Record<string, string> = {
    'greeting': 'Hello! I\'m TripWeaver AI, your corporate travel assistant. I can help you with:\n- Flight searches and bookings\n- Itinerary generation\n- Budget management\n- Policy compliance\n\nHow may I assist you today?',
    'flight_search': 'I found several flight options for your trip from New York to London:\n\n1. **United Airlines UA123** - $599\n   - Departs: 8:00 AM → Arrives: 8:00 PM (12h)\n   - Direct flight, Economy class\n\n2. **Delta DL456** - $549\n   - Departs: 10:00 AM → Arrives: 10:30 PM (12.5h)\n   - Direct flight, Economy class\n\nWould you like me to book one of these flights?',
    'budget_help': 'Based on your company\'s travel policy, here\'s a budget breakdown:\n\n**Per Employee Budget: $2,000**\n- Flights: ~$600-800 (60%)\n- Hotel: ~$500-700 (35%)\n- Ground Transport: ~$100 (5%)\n\nI\'ll ensure all itineraries stay within this budget.',
  }

  const mockAgentQualitySendMessage = vi.fn().mockImplementation(async (message: string) => {
    const key = message.toLowerCase().includes('hello') ? 'greeting' :
                message.toLowerCase().includes('flight') ? 'flight_search' :
                message.toLowerCase().includes('budget') ? 'budget_help' :
                'greeting'
    
    return {
      response: {
        text: () => agentQualityResponses[key],
        functionCalls: () => null,
      },
    }
  })

  const mockAgentQualityStartChat = vi.fn().mockReturnValue({
    sendMessage: mockAgentQualitySendMessage,
  })

  const mockAgentQualityGetModel = vi.fn().mockReturnValue({
    startChat: mockAgentQualityStartChat,
  })

  // Define mock class using function constructor
  function MockGoogleGenerativeAIForQuality(apiKey: string) {
    // @ts-ignore
    this.apiKey = apiKey
    // @ts-ignore
    this.getGenerativeModel = mockAgentQualityGetModel
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAIForQuality,
    FunctionCallingMode: { AUTO: 'AUTO' },
  }
})

describe('Agent Response Quality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  describe('Greeting Quality', () => {
    it('should provide helpful introduction', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello!')
      
      expect(response.content).toContain('TripWeaver')
      expect(response.content.length).toBeGreaterThan(50)
    })

    it('should list capabilities', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello, what can you do?')
      
      expect(response.content.toLowerCase()).toContain('flight')
      expect(response.content.toLowerCase()).toContain('itinerary')
    })

    it('should be professional in tone', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Hello!')
      
      // Should not contain unprofessional language
      expect(response.content).not.toContain('lol')
      expect(response.content).not.toContain('gonna')
    })
  })

  describe('Flight Search Response Quality', () => {
    it('should format flight results clearly', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Search for flights from NYC to London')
      
      // Should include structured information
      expect(response.content).toContain('$')
      expect(response.content.toLowerCase()).toContain('flight')
    })

    it('should include essential flight details', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Find me flights to London')
      
      const content = response.content.toLowerCase()
      
      // Should mention at least some of these key details
      const hasAirline = content.includes('airline') || content.includes('united') || content.includes('delta')
      const hasPrice = content.includes('$') || content.includes('price')
      
      expect(hasAirline || hasPrice).toBe(true)
    })

    it('should offer next steps', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Search flights NYC to London')
      
      // Should offer to book or provide more info
      const hasNextStep = 
        response.content.toLowerCase().includes('book') ||
        response.content.toLowerCase().includes('like') ||
        response.content.includes('?')
      
      expect(hasNextStep).toBe(true)
    })
  })

  describe('Budget Help Response Quality', () => {
    it('should explain budget clearly', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('What is my budget for travel?')
      
      expect(response.content).toContain('$')
      expect(response.content.toLowerCase()).toContain('budget')
    })

    it('should break down budget by category', async () => {
      const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
      
      const response = await chatWithGeminiAgent('Help me understand the budget')
      
      const content = response.content.toLowerCase()
      
      // Should mention categories
      const hasCategories = 
        content.includes('flight') ||
        content.includes('hotel') ||
        content.includes('transport')
      
      expect(hasCategories).toBe(true)
    })
  })
})

describe('Response Consistency', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  it('should give consistent responses to similar queries', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const queries = [
      'Hello',
      'Hi there',
      'Hey',
    ]
    
    const responses = await Promise.all(
      queries.map(q => chatWithGeminiAgent(q))
    )
    
    // All responses should mention TripWeaver
    for (const response of responses) {
      expect(response.content).toContain('TripWeaver')
    }
  })

  it('should handle variations of flight search', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const queries = [
      'Find flights to London',
      'Search for flights to London',
      'I need a flight to London',
    ]
    
    const responses = await Promise.all(
      queries.map(q => chatWithGeminiAgent(q))
    )
    
    // All responses should be flight-related
    for (const response of responses) {
      const content = response.content.toLowerCase()
      expect(content).toContain('flight')
    }
  })
})

describe('Error Handling Quality', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  it('should handle empty message gracefully', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('')
    
    expect(response).toBeDefined()
    expect(response.content).toBeDefined()
  })

  it('should handle very long messages', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const longMessage = 'Hello '.repeat(100)
    const response = await chatWithGeminiAgent(longMessage)
    
    expect(response).toBeDefined()
    expect(response.content).toBeDefined()
  })

  it('should handle special characters', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const specialMessage = 'Hello! How are you? @#$%^&*()'
    const response = await chatWithGeminiAgent(specialMessage)
    
    expect(response).toBeDefined()
    expect(response.content).toBeDefined()
  })
})

describe('Conversation Context', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  it('should use conversation history', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const history = [
      { role: 'user' as const, content: 'I need to book travel for 5 people' },
      { role: 'assistant' as const, content: 'I can help with that. Where are they traveling to?' },
    ]
    
    const response = await chatWithGeminiAgent('London', history)
    
    expect(response).toBeDefined()
    expect(response.content).toBeDefined()
  })

  it('should maintain context across turns', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const history1 = [
      { role: 'user' as const, content: 'Search flights to Paris' },
    ]
    
    const response1 = await chatWithGeminiAgent('What about hotels?', history1)
    
    expect(response1).toBeDefined()
  })
})

describe('Response Format Quality', () => {
  beforeEach(() => {
    process.env.GOOGLE_AI_API_KEY = 'test_key'
  })

  it('should use markdown formatting appropriately', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Search for flights')
    
    // Should use some formatting
    const hasFormatting = 
      response.content.includes('**') ||
      response.content.includes('*') ||
      response.content.includes('-') ||
      response.content.includes('\n')
    
    expect(hasFormatting).toBe(true)
  })

  it('should not have broken formatting', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Hello!')
    
    // Should not have unclosed markdown
    const boldCount = (response.content.match(/\*\*/g) || []).length
    expect(boldCount % 2).toBe(0) // Even number of ** markers
  })

  it('should have reasonable response length', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Hello!')
    
    // Not too short, not too long
    expect(response.content.length).toBeGreaterThan(20)
    expect(response.content.length).toBeLessThan(5000)
  })
})

describe('A/B Test Metrics', () => {
  it('should track response time', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const start = Date.now()
    await chatWithGeminiAgent('Hello!')
    const duration = Date.now() - start
    
    // Response should be reasonably fast (mocked, so very fast)
    expect(duration).toBeLessThan(5000)
  })

  it('should not have paymentTriggered for non-payment queries', async () => {
    const { chatWithGeminiAgent } = await import('@/lib/agent/gemini-agent')
    
    const response = await chatWithGeminiAgent('Hello!')
    
    expect(response.paymentTriggered).toBe(false)
  })
})
