/**
 * Unit tests for the Gemini Agent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { allFunctionDeclarations, TOOL_CATEGORIES } from '@/lib/agent/function-definitions'

describe('Agent Function Definitions', () => {
  describe('allFunctionDeclarations', () => {
    it('should have all required function declarations', () => {
      const functionNames = allFunctionDeclarations.map(f => f.name)
      
      expect(functionNames).toContain('search_flights')
      expect(functionNames).toContain('get_flight_details')
      expect(functionNames).toContain('generate_itinerary')
      expect(functionNames).toContain('generate_team_itineraries')
      expect(functionNames).toContain('check_budget_compliance')
      expect(functionNames).toContain('process_payment')
      expect(functionNames).toContain('get_event_details')
      expect(functionNames).toContain('get_employee_details')
      expect(functionNames).toContain('list_pending_trips')
    })

    it('should have valid parameter schemas for all functions', () => {
      for (const func of allFunctionDeclarations) {
        expect(func.name).toBeDefined()
        expect(func.description).toBeDefined()
        expect(func.parameters).toBeDefined()
        expect(func.parameters.type).toBe('object')
        expect(func.parameters.properties).toBeDefined()
      }
    })

    it('should have required fields for search_flights', () => {
      const searchFlights = allFunctionDeclarations.find(f => f.name === 'search_flights')
      
      expect(searchFlights).toBeDefined()
      expect(searchFlights!.parameters.required).toContain('origin')
      expect(searchFlights!.parameters.required).toContain('destination')
      expect(searchFlights!.parameters.required).toContain('departureDate')
      expect(searchFlights!.parameters.required).toContain('passengers')
    })
  })

  describe('TOOL_CATEGORIES', () => {
    it('should categorize tools correctly', () => {
      expect(TOOL_CATEGORIES.KIWI_TOOLS).toContain('search_flights')
      expect(TOOL_CATEGORIES.KIWI_TOOLS).toContain('get_flight_details')
      expect(TOOL_CATEGORIES.ITINERARY_TOOLS).toContain('generate_itinerary')
      expect(TOOL_CATEGORIES.ITINERARY_TOOLS).toContain('generate_team_itineraries')
      expect(TOOL_CATEGORIES.PAYMENT_TOOLS).toContain('process_payment')
      expect(TOOL_CATEGORIES.BUDGET_TOOLS).toContain('check_budget_compliance')
    })
  })
})
