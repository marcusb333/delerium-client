/**
 * Crypto module public API
 * 
 * This module provides encryption/decryption capabilities with a pluggable architecture.
 * The default implementation uses AES-GCM with Web Crypto API.
 */

export { ICryptoProvider, EncryptionResult, DecryptionInput } from './interfaces.js';
export { AesGcmCryptoProvider } from './aes-gcm.js';
export { encodeBase64Url, decodeBase64Url } from './encoding.js';

import { AesGcmCryptoProvider } from './aes-gcm.js';
import { ICryptoProvider } from './interfaces.js';

/**
 * Factory function for creating the default crypto provider
 * 
 * @returns Default crypto provider (AES-GCM)
 */
export function createCryptoProvider(): ICryptoProvider {
  return new AesGcmCryptoProvider();
}
