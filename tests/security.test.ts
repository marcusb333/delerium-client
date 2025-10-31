/**
 * security.test.ts - Comprehensive tests for security module
 * 
 * Tests all security functions including:
 * - Validation functions
 * - Password encryption/decryption (ArrayBuffer-based)
 * - PBKDF2 key derivation
 * - Security utilities
 */

import {
  validateContentSize,
  validateExpiration,
  validateViewCount,
  validatePassword,
  isValidUTF8,
  secureClear,
  secureClearBuffer,
  getSafeErrorMessage,
  ERROR_MESSAGES,
  deriveKeyFromPassword,
  generateSalt,
  encryptWithPassword,
  decryptWithPassword,
} from '../src/security.js';

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('validateContentSize', () => {
  it('should accept valid content', () => {
    const result = validateContentSize('Hello, world!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty content', () => {
    const result = validateContentSize('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Content cannot be empty');
  });

  it('should reject content that is too large', () => {
    const largeContent = 'x'.repeat(1024 * 1024 + 1);
    const result = validateContentSize(largeContent);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Content too large');
  });

  it('should accept content just under the limit', () => {
    const content = 'x'.repeat(1024 * 1024 - 100);
    const result = validateContentSize(content);
    expect(result.isValid).toBe(true);
  });
});

describe('validateExpiration', () => {
  it('should accept valid expiration times', () => {
    const result = validateExpiration(60);
    expect(result.isValid).toBe(true);
  });

  it('should accept minimum expiration', () => {
    const result = validateExpiration(1);
    expect(result.isValid).toBe(true);
  });

  it('should accept maximum expiration', () => {
    const result = validateExpiration(7 * 24 * 60);
    expect(result.isValid).toBe(true);
  });

  it('should reject below minimum', () => {
    const result = validateExpiration(0);
    expect(result.isValid).toBe(false);
  });

  it('should reject above maximum', () => {
    const result = validateExpiration(8 * 24 * 60);
    expect(result.isValid).toBe(false);
  });

  it('should reject non-integers', () => {
    const result = validateExpiration(1.5);
    expect(result.isValid).toBe(false);
  });
});

describe('validateViewCount', () => {
  it('should accept valid view counts', () => {
    const result = validateViewCount(5);
    expect(result.isValid).toBe(true);
  });

  it('should reject zero', () => {
    const result = validateViewCount(0);
    expect(result.isValid).toBe(false);
  });

  it('should reject above 100', () => {
    const result = validateViewCount(101);
    expect(result.isValid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept strong passwords', () => {
    const result = validatePassword('MySecureP@ssw0rd123');
    expect(result.isValid).toBe(true);
  });

  it('should reject short passwords', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
  });

  it('should reject long passwords', () => {
    const result = validatePassword('a'.repeat(129));
    expect(result.isValid).toBe(false);
  });

  it('should accept minimum length', () => {
    const result = validatePassword('Pass1234');
    expect(result.isValid).toBe(true);
  });
});

// ============================================================================
// UTILITY TESTS
// ============================================================================

describe('isValidUTF8', () => {
  it('should accept valid UTF-8', () => {
    expect(isValidUTF8('Hello, world!')).toBe(true);
    expect(isValidUTF8('????')).toBe(true);
    expect(isValidUTF8('??????')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(isValidUTF8('')).toBe(true);
  });
});

describe('secureClear', () => {
  it('should not throw', () => {
    expect(() => secureClear('sensitive')).not.toThrow();
  });

  it('should handle empty strings', () => {
    expect(() => secureClear('')).not.toThrow();
  });
});

describe('secureClearBuffer', () => {
  it('should overwrite buffer with random data', () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    
    // Fill with a known pattern
    for (let i = 0; i < view.length; i++) {
      view[i] = 0xFF;
    }
    
    secureClearBuffer(buffer);
    
    // Buffer should be overwritten (not all 0xFF anymore)
    const clearedView = new Uint8Array(buffer);
    let allFF = true;
    for (let i = 0; i < clearedView.length; i++) {
      if (clearedView[i] !== 0xFF) {
        allFF = false;
        break;
      }
    }
    expect(allFF).toBe(false); // Should have been overwritten
  });

  it('should handle empty buffers', () => {
    expect(() => secureClearBuffer(new ArrayBuffer(0))).not.toThrow();
  });
});

describe('getSafeErrorMessage', () => {
  // Suppress expected console.error calls in these tests
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should return safe message', () => {
    const error = new Error('Internal details');
    const message = getSafeErrorMessage(error, 'test');
    expect(message).toBeTruthy();
    expect(message).not.toContain('Internal details');
  });

  it('should handle null/undefined', () => {
    expect(getSafeErrorMessage(null, 'test')).toBeTruthy();
    expect(getSafeErrorMessage(undefined, 'test')).toBeTruthy();
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have all messages', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBeTruthy();
    expect(ERROR_MESSAGES.SERVER_ERROR).toBeTruthy();
    expect(ERROR_MESSAGES.ENCRYPTION_ERROR).toBeTruthy();
    expect(ERROR_MESSAGES.DECRYPTION_ERROR).toBeTruthy();
  });
});

// ============================================================================
// CRYPTOGRAPHY TESTS
// ============================================================================

describe('generateSalt', () => {
  it('should generate 16 byte salt', () => {
    const salt = generateSalt();
    expect(salt.byteLength).toBe(16);
  });

  it('should generate unique salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(new Uint8Array(salt1)).not.toEqual(new Uint8Array(salt2));
  });
});

describe('deriveKeyFromPassword', () => {
  it('should derive key from password and salt', async () => {
    const password = 'TestPassword123';
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt);
    
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
  });

  it('should be deterministic', async () => {
    const password = 'TestPassword123';
    const salt = generateSalt();
    const content = 'test';
    
    // Derive same key twice
    const key1 = await deriveKeyFromPassword(password, salt);
    const key2 = await deriveKeyFromPassword(password, salt);
    
    // Encrypt same content with both keys - should produce different results (different IVs)
    // but both should be able to decrypt
    const iv1 = crypto.getRandomValues(new Uint8Array(12));
    const enc1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv1 }, key1, new TextEncoder().encode(content));
    const dec1 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv1 }, key2, enc1);
    
    expect(new TextDecoder().decode(dec1)).toBe(content);
  });

  it('should differ with different passwords', async () => {
    const salt = generateSalt();
    const content = 'test';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key1 = await deriveKeyFromPassword('Password1', salt);
    const key2 = await deriveKeyFromPassword('Password2', salt);
    
    // Encrypt with key1
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, new TextEncoder().encode(content));
    
    // Try to decrypt with key2 - should fail
    await expect(
      crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
    ).rejects.toThrow();
  });

  it('should differ with different salts', async () => {
    const password = 'TestPassword123';
    const content = 'test';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key1 = await deriveKeyFromPassword(password, generateSalt());
    const key2 = await deriveKeyFromPassword(password, generateSalt());
    
    // Encrypt with key1
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, new TextEncoder().encode(content));
    
    // Try to decrypt with key2 - should fail
    await expect(
      crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
    ).rejects.toThrow();
  });
});

describe('encryptWithPassword', () => {
  it('should return ArrayBuffers', async () => {
    const result = await encryptWithPassword('Secret message', 'TestPassword123');
    
    expect(result.encryptedData).toBeDefined();
    expect(result.iv).toBeDefined();
    expect(result.salt).toBeDefined();
    expect(result.encryptedData.byteLength).toBeGreaterThan(0);
    expect(result.iv.byteLength).toBe(12);
    expect(result.salt.byteLength).toBe(16);
  });

  it('should produce different results each time', async () => {
    const content = 'Secret message';
    const password = 'TestPassword123';
    
    const result1 = await encryptWithPassword(content, password);
    const result2 = await encryptWithPassword(content, password);
    
    // Different IVs and salts mean different ciphertexts
    expect(new Uint8Array(result1.encryptedData)).not.toEqual(new Uint8Array(result2.encryptedData));
    expect(new Uint8Array(result1.iv)).not.toEqual(new Uint8Array(result2.iv));
    expect(new Uint8Array(result1.salt)).not.toEqual(new Uint8Array(result2.salt));
  });

  it('should handle empty content', async () => {
    const result = await encryptWithPassword('', 'TestPassword123');
    expect(result.encryptedData.byteLength).toBeGreaterThan(0);
  });

  it('should handle unicode', async () => {
    const result = await encryptWithPassword('???? ??', 'TestPassword123');
    expect(result.encryptedData.byteLength).toBeGreaterThan(0);
  });

  it('should handle long content', async () => {
    const result = await encryptWithPassword('x'.repeat(10000), 'TestPassword123');
    expect(result.encryptedData.byteLength).toBeGreaterThan(10000);
  });
});

describe('decryptWithPassword', () => {
  it('should decrypt with correct password', async () => {
    const original = 'Secret message';
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(original, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(decrypted).toBe(original);
  });

  it('should fail with wrong password', async () => {
    const original = 'Secret message';
    const encrypted = await encryptWithPassword(original, 'TestPassword123');
    
    await expect(
      decryptWithPassword(
        encrypted.encryptedData,
        'WrongPassword',
        encrypted.salt,
        encrypted.iv
      )
    ).rejects.toThrow();
  });

  it('should handle empty content', async () => {
    const original = '';
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(original, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(decrypted).toBe(original);
  });

  it('should handle unicode', async () => {
    const original = '???? ?? Caf?';
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(original, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(decrypted).toBe(original);
  });

  it('should handle long content', async () => {
    const original = 'x'.repeat(10000);
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(original, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(decrypted).toBe(original);
  });

  it('should handle newlines and special chars', async () => {
    const original = 'Line1\nLine2\tTabbed\r\nWindows';
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(original, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(decrypted).toBe(original);
  });

  it('should fail with corrupted ciphertext', async () => {
    const encrypted = await encryptWithPassword('Secret', 'TestPassword123');
    
    // Corrupt the ciphertext
    const corrupted = encrypted.encryptedData.slice(0);
    new Uint8Array(corrupted)[0] ^= 0xFF;
    
    await expect(
      decryptWithPassword(corrupted, 'TestPassword123', encrypted.salt, encrypted.iv)
    ).rejects.toThrow();
  });

  it('should fail with corrupted IV', async () => {
    const encrypted = await encryptWithPassword('Secret', 'TestPassword123');
    
    // Corrupt the IV
    const corruptedIv = encrypted.iv.slice(0);
    new Uint8Array(corruptedIv)[0] ^= 0xFF;
    
    await expect(
      decryptWithPassword(encrypted.encryptedData, 'TestPassword123', encrypted.salt, corruptedIv)
    ).rejects.toThrow();
  });

  it('should fail with corrupted salt', async () => {
    const encrypted = await encryptWithPassword('Secret', 'TestPassword123');
    
    // Corrupt the salt
    const corruptedSalt = encrypted.salt.slice(0);
    new Uint8Array(corruptedSalt)[0] ^= 0xFF;
    
    await expect(
      decryptWithPassword(encrypted.encryptedData, 'TestPassword123', corruptedSalt, encrypted.iv)
    ).rejects.toThrow();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Password encryption integration', () => {
  const testCases = [
    'Simple text',
    'Text with\nnewlines',
    'Unicode: ???? ??',
    'Special: !@#$%^&*()',
    'x'.repeat(1000),
  ];

  testCases.forEach((content) => {
    it(`should handle: ${content.substring(0, 30)}`, async () => {
      const password = 'TestPassword123';
      const encrypted = await encryptWithPassword(content, password);
      const decrypted = await decryptWithPassword(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );
      expect(decrypted).toBe(content);
    });
  });

  it('should maintain zero-knowledge', async () => {
    const content = 'Secret message';
    const password = 'TestPassword123';
    
    const encrypted = await encryptWithPassword(content, password);
    
    // Convert to strings to check content
    const encStr = String.fromCharCode(...new Uint8Array(encrypted.encryptedData));
    const saltStr = String.fromCharCode(...new Uint8Array(encrypted.salt));
    const ivStr = String.fromCharCode(...new Uint8Array(encrypted.iv));
    
    // Should not contain plaintext or password
    expect(encStr).not.toContain(password);
    expect(encStr).not.toContain(content);
    expect(saltStr).not.toContain(password);
    expect(ivStr).not.toContain(password);
  });
});
