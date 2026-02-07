/**
 * Unit tests for encryption utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hash,
  compareHash,
  generateToken,
  maskSensitive,
  encryptFields,
  decryptFields,
  isEncryptionConfigured,
} from '@/lib/encryption'

describe('Encryption Utilities', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(encrypted).not.toBe(plaintext)
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'Test data'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)
      
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000)
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('encryptObject/decryptObject', () => {
    it('should encrypt and decrypt objects', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: { theme: 'dark' },
      }
      
      const encrypted = encryptObject(data)
      const decrypted = decryptObject(encrypted)
      
      expect(decrypted).toEqual(data)
    })

    it('should handle nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      }
      
      const encrypted = encryptObject(data)
      const decrypted = decryptObject(encrypted)
      
      expect(decrypted).toEqual(data)
    })
  })

  describe('hash/compareHash', () => {
    it('should produce consistent hashes', () => {
      const value = 'test_value'
      const hash1 = hash(value)
      const hash2 = hash(value)
      
      expect(hash1).toBe(hash2)
    })

    it('should compare hashes correctly', () => {
      const value = 'test_value'
      const hashed = hash(value)
      
      expect(compareHash(value, hashed)).toBe(true)
      expect(compareHash('wrong_value', hashed)).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate tokens of specified length', () => {
      const token16 = generateToken(16)
      const token32 = generateToken(32)
      
      expect(token16.length).toBe(32) // Hex doubles the length
      expect(token32.length).toBe(64)
    })

    it('should generate unique tokens', () => {
      const token1 = generateToken()
      const token2 = generateToken()
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('maskSensitive', () => {
    it('should mask sensitive values', () => {
      const value = 'sk-secret-api-key-12345'
      const masked = maskSensitive(value)
      
      expect(masked).toMatch(/^sk-s\*+2345$/)
    })

    it('should handle short values', () => {
      const value = '1234'
      const masked = maskSensitive(value)
      
      expect(masked).toBe('****')
    })

    it('should use custom visible character count', () => {
      const value = 'secretkey123456'
      const masked = maskSensitive(value, 2)
      
      expect(masked).toMatch(/^se\*+56$/)
    })
  })

  describe('encryptFields/decryptFields', () => {
    it('should encrypt specific fields', () => {
      const data = {
        id: '123',
        name: 'John',
        ssn: '123-45-6789',
        notes: 'Some notes',
      }
      
      const encrypted = encryptFields(data, ['ssn'])
      
      expect(encrypted.id).toBe('123')
      expect(encrypted.name).toBe('John')
      expect(encrypted.ssn).not.toBe('123-45-6789')
      expect(encrypted.notes).toBe('Some notes')
    })

    it('should decrypt specific fields', () => {
      const data = {
        id: '123',
        name: 'John',
        ssn: '123-45-6789',
      }
      
      const encrypted = encryptFields(data, ['ssn'])
      const decrypted = decryptFields(encrypted, ['ssn'])
      
      expect(decrypted).toEqual(data)
    })
  })

  describe('isEncryptionConfigured', () => {
    it('should return true when encryption is working', () => {
      expect(isEncryptionConfigured()).toBe(true)
    })
  })
})
