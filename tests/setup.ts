/**
 * Test Setup Configuration
 * 
 * This file runs before all tests to configure the testing environment.
 */

import { beforeAll, afterAll, afterEach } from 'vitest'

// Set up environment variables for testing
beforeAll(() => {
  // Mock API keys for testing
  process.env.GOOGLE_AI_API_KEY = 'test_google_ai_key'
  process.env.LOCUS_API_KEY = 'test_locus_key'
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-deployment.convex.cloud'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  
  // Encryption key for testing (32 bytes / 64 hex chars for AES-256)
  process.env.ENCRYPTION_KEY = 'a'.repeat(64) // Test encryption key
  
  // Test mode flags
  process.env.NODE_ENV = 'test'
  process.env.SKIP_MCP_TESTS = 'true' // Skip real MCP tests by default
  
  console.log('Test environment initialized')
})

// Clean up after all tests
afterAll(() => {
  console.log('Test environment cleanup')
})

// Reset mocks after each test
afterEach(() => {
  // Vitest automatically resets mocks with vi.clearAllMocks() if configured
})

// Global test utilities
declare global {
  var testUtils: {
    wait: (ms: number) => Promise<void>
    generateId: (prefix: string) => string
  }
}

globalThis.testUtils = {
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  generateId: (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
}
