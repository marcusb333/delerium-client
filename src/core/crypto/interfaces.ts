/**
 * Crypto Provider Interface
 * Allows swapping encryption implementations
 */

/**
 * Result of encrypting data
 */
export interface EncryptionResult {
  /** Base64url-encoded ciphertext */
  ciphertext: string;
  /** Base64url-encoded encryption key (or salt for password-based) */
  key: string;
  /** Base64url-encoded initialization vector */
  iv: string;
  /** Algorithm used for encryption */
  algorithm: string;
}

/**
 * Input for decryption
 */
export interface DecryptionInput {
  /** Base64url-encoded ciphertext */
  ciphertext: string;
  /** Base64url-encoded encryption key (or salt for password-based) */
  key: string;
  /** Base64url-encoded initialization vector */
  iv: string;
  /** Algorithm used (default: AES-GCM) */
  algorithm?: string;
}

/**
 * Crypto Provider Interface
 * Implement this interface to provide custom encryption
 */
export interface ICryptoProvider {
  /**
   * Encrypt plaintext with random key
   * 
   * @param plaintext Content to encrypt
   * @returns Promise resolving to encryption result
   */
  encrypt(plaintext: string): Promise<EncryptionResult>;

  /**
   * Decrypt ciphertext with key
   * 
   * @param input Decryption input (ciphertext, key, iv)
   * @returns Promise resolving to decrypted plaintext
   * @throws Error if decryption fails
   */
  decrypt(input: DecryptionInput): Promise<string>;

  /**
   * Encrypt with password-based encryption
   * 
   * @param plaintext Content to encrypt
   * @param password User-provided password
   * @returns Promise resolving to encryption result (salt in 'key' field)
   */
  encryptWithPassword(plaintext: string, password: string): Promise<EncryptionResult>;

  /**
   * Decrypt with password-based encryption
   * 
   * @param input Decryption input (salt in 'key' field)
   * @param password User-provided password
   * @returns Promise resolving to decrypted plaintext
   * @throws Error if decryption fails (wrong password or corrupted data)
   */
  decryptWithPassword(input: DecryptionInput, password: string): Promise<string>;

  /**
   * Generate random encryption key
   * 
   * @returns Promise resolving to a CryptoKey
   */
  generateKey(): Promise<CryptoKey>;

  /**
   * Generate random initialization vector
   * 
   * @returns Random IV as Uint8Array
   */
  generateIV(): Uint8Array;
}
