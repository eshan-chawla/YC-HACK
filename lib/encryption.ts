/**
 * Encryption utilities for sensitive data
 * 
 * Uses AES-256-GCM for authenticated encryption of sensitive fields
 * like employee restrictions, payment info, etc.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Key should be a 32-byte (256-bit) hex string
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY not set. Generate one with: openssl rand -hex 32"
    );
  }

  // If key is provided as hex (64 chars), convert to buffer
  if (keyHex.length === 64) {
    return Buffer.from(keyHex, "hex");
  }

  // If key is provided as raw string, derive key using scrypt
  const salt = Buffer.from("tripweaver_salt_v1"); // Fixed salt for deterministic key derivation
  return scryptSync(keyHex, salt, KEY_LENGTH);
}

/**
 * Encrypt a string value
 * Returns base64-encoded string containing: IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (16) + AuthTag (16) + Ciphertext (variable)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  
  return combined.toString("base64");
}

/**
 * Decrypt a string value
 * Expects base64-encoded string containing: IV + AuthTag + Ciphertext
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt an object (serializes to JSON first)
 */
export function encryptObject<T extends Record<string, unknown>>(data: T): string {
  const json = JSON.stringify(data);
  return encrypt(json);
}

/**
 * Decrypt an object
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedData: string): T {
  const json = decrypt(encryptedData);
  return JSON.parse(json) as T;
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hash(value: string): string {
  const salt = process.env.ENCRYPTION_KEY?.slice(0, 32) || "default_salt";
  return scryptSync(value, salt, 32).toString("hex");
}

/**
 * Compare a plain value with a hash
 */
export function compareHash(plainValue: string, hashedValue: string): boolean {
  const newHash = hash(plainValue);
  // Constant-time comparison to prevent timing attacks
  if (newHash.length !== hashedValue.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < newHash.length; i++) {
    result |= newHash.charCodeAt(i) ^ hashedValue.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return "*".repeat(value.length);
  }
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const masked = "*".repeat(value.length - visibleChars * 2);
  return `${start}${masked}${end}`;
}

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    const value = data[field];
    if (value !== undefined && value !== null) {
      if (typeof value === "string") {
        (result as Record<string, unknown>)[field as string] = encrypt(value);
      } else if (typeof value === "object") {
        (result as Record<string, unknown>)[field as string] = encryptObject(
          value as Record<string, unknown>
        );
      }
    }
  }
  
  return result;
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt: (keyof T)[],
  fieldTypes: Partial<Record<keyof T, "string" | "object">> = {}
): T {
  const result = { ...data };
  
  for (const field of fieldsToDecrypt) {
    const value = data[field];
    if (value !== undefined && value !== null && typeof value === "string") {
      try {
        if (fieldTypes[field] === "object") {
          (result as Record<string, unknown>)[field as string] = decryptObject(value);
        } else {
          (result as Record<string, unknown>)[field as string] = decrypt(value);
        }
      } catch (error) {
        // Field might not be encrypted, keep original value
        console.warn(`Failed to decrypt field ${String(field)}:`, error);
      }
    }
  }
  
  return result;
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    const testValue = "test_encryption";
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    return decrypted === testValue;
  } catch {
    return false;
  }
}
