/**
 * AES-GCM Crypto Provider Implementation
 * Uses Web Crypto API for secure encryption
 */

import { ICryptoProvider, EncryptionResult, DecryptionInput } from './interfaces.js';
import { encodeBase64Url, decodeBase64Url } from './encoding.js';

/**
 * AES-GCM 256-bit encryption implementation
 * 
 * Features:
 * - AES-GCM provides both confidentiality and authenticity
 * - 256-bit keys for strong security
 * - 96-bit (12-byte) IVs as recommended by NIST
 * - Password-based encryption using PBKDF2 with 100,000 iterations
 */
export class AesGcmCryptoProvider implements ICryptoProvider {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly ivLength = 12;
  private readonly pbkdf2Iterations = 100000;

  /**
   * Generate a new AES-GCM 256-bit encryption key
   */
  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random 12-byte IV
   */
  generateIV(): Uint8Array {
    const iv = new Uint8Array(this.ivLength);
    crypto.getRandomValues(iv);
    return iv;
  }

  /**
   * Encrypt plaintext with random key
   */
  async encrypt(plaintext: string): Promise<EncryptionResult> {
    const key = await this.generateKey();
    const iv = this.generateIV();

    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv as BufferSource },
      key,
      plaintextBytes
    );

    const rawKey = await crypto.subtle.exportKey('raw', key);

    return {
      ciphertext: encodeBase64Url(ciphertext),
      key: encodeBase64Url(rawKey),
      iv: encodeBase64Url(iv),
      algorithm: this.algorithm
    };
  }

  /**
   * Decrypt ciphertext with key
   */
  async decrypt(input: DecryptionInput): Promise<string> {
    const keyBytes = decodeBase64Url(input.key);
    const ivBytes = decodeBase64Url(input.iv);
    const ciphertextBytes = decodeBase64Url(input.ciphertext);

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: this.algorithm },
      false,
      ['decrypt']
    );

    const plaintextBytes = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: new Uint8Array(ivBytes) },
      key,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  }

  /**
   * Generate salt for password-based encryption
   */
  private generateSalt(): Uint8Array {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return salt;
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.pbkdf2Iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt with password-based encryption
   */
  async encryptWithPassword(plaintext: string, password: string): Promise<EncryptionResult> {
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const key = await this.deriveKeyFromPassword(password, salt);

    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv as BufferSource },
      key,
      plaintextBytes
    );

    return {
      ciphertext: encodeBase64Url(ciphertext),
      key: encodeBase64Url(salt), // Return salt as 'key' for URL
      iv: encodeBase64Url(iv),
      algorithm: `${this.algorithm}-PBKDF2`
    };
  }

  /**
   * Decrypt with password-based encryption
   */
  async decryptWithPassword(input: DecryptionInput, password: string): Promise<string> {
    const salt = new Uint8Array(decodeBase64Url(input.key));
    const iv = new Uint8Array(decodeBase64Url(input.iv));
    const ciphertextBytes = decodeBase64Url(input.ciphertext);

    const key = await this.deriveKeyFromPassword(password, salt);

    const plaintextBytes = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      key,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  }
}
