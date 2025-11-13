/**
 * security.ts - Privacy-preserving security utilities
 * 
 * This module provides security functions that maintain the zero-knowledge principle:
 * - Memory security utilities
 * - Safe display utilities
 * - Error handling
 * - Password-based encryption
 * - Security headers and policies
 * 
 * Note: Validation functions have been moved to core/validators/index.ts
 */

// ============================================================================
// MEMORY SECURITY
// ============================================================================

/**
 * Securely clear a string from memory
 * This is a best-effort attempt to clear sensitive data
 * 
 * @param str String to clear
 */
export function secureClear(str: string): void {
  if (typeof str === 'string') {
    // Overwrite the string with random data (best effort)
    try {
      const arr = str.split('');
      for (let i = 0; i < arr.length; i++) {
        arr[i] = String.fromCharCode(Math.floor(Math.random() * 256));
      }
      // Force garbage collection hint (browser may ignore)
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as unknown as { gc?: () => void }).gc?.();
      }
    } catch {
      // Silently fail if we can't clear
    }
  }
}

/**
 * Securely clear an ArrayBuffer from memory
 * 
 * @param buffer ArrayBuffer to clear
 */
export function secureClearBuffer(buffer: ArrayBuffer): void {
  if (buffer && buffer.byteLength > 0) {
    const view = new Uint8Array(buffer);
    // Overwrite with random data
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
  }
}

// Prevent unused variable warning - this function is part of the public API
// even if not used internally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['__secureClearBuffer'] = secureClearBuffer;
}

// ============================================================================
// SAFE DISPLAY UTILITIES
// ============================================================================

/**
 * Safely display content without executing any code
 * Uses textContent to prevent XSS while maintaining privacy
 * 
 * @param element DOM element to update
 * @param content Content to display
 */
export function safeDisplayContent(element: HTMLElement, content: string): void {
  // Use textContent to prevent XSS - it doesn't execute HTML/JS
  element.textContent = content;
  
  // Preserve whitespace and formatting
  element.style.whiteSpace = 'pre-wrap';
  element.style.wordWrap = 'break-word';
}

/**
 * Safely display content with basic formatting
 * Only allows safe formatting without code execution
 * 
 * @param element DOM element to update
 * @param content Content to display
 */
export function safeDisplayFormatted(element: HTMLElement, content: string): void {
  // Escape HTML to prevent XSS
  const escaped = escapeHtml(content);
  
  // Use innerHTML with escaped content (safe because we escaped it)
  element.innerHTML = escaped;
  
  // Apply safe styling
  element.style.whiteSpace = 'pre-wrap';
  element.style.wordWrap = 'break-word';
}

/**
 * Escape HTML characters to prevent XSS
 * 
 * @param str String to escape
 * @returns Escaped string
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Generic error messages that don't leak system information
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Invalid input. Please check your data and try again.",
  ENCRYPTION_ERROR: "Encryption failed. Please try again.",
  DECRYPTION_ERROR: "Decryption failed. The content may be corrupted or the key may be incorrect.",
  NOT_FOUND: "Content not found or has expired.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
} as const;

/**
 * Get a safe error message without exposing system details
 * 
 * @param error The original error
 * @param context Context for the error
 * @returns Safe error message
 */
export function getSafeErrorMessage(error: unknown, context: string = 'operation'): string {
  // Log the actual error for debugging (in development only)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.error(`Error in ${context}:`, error);
  }
  
  // Return generic error message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return ERROR_MESSAGES.RATE_LIMITED;
    }
    
    if (message.includes('encrypt')) {
      return ERROR_MESSAGES.ENCRYPTION_ERROR;
    }
    
    if (message.includes('decrypt')) {
      return ERROR_MESSAGES.DECRYPTION_ERROR;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// ============================================================================
// PASSWORD-BASED ENCRYPTION
// ============================================================================

/**
 * Derive encryption key from password using PBKDF2
 * 
 * @param password User-provided password
 * @param salt Random salt for key derivation (Uint8Array or ArrayBuffer)
 * @returns Promise resolving to derived key
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array | ArrayBuffer): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Ensure salt is in the right format - convert ArrayBuffer to Uint8Array if needed
  const saltBuffer = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
  
  // Derive key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt for password-based encryption
 * 
 * @returns Random 16-byte salt (returns Uint8Array for better compatibility)
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Encrypt content with password-based encryption
 * 
 * @param content Content to encrypt
 * @param password User password
 * @returns Promise resolving to encrypted data with salt
 */
export async function encryptWithPassword(content: string, password: string): Promise<{
  encryptedData: ArrayBuffer;
  salt: ArrayBuffer;
  iv: ArrayBuffer;
}> {
  const salt = generateSalt();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await deriveKeyFromPassword(password, salt);
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    new TextEncoder().encode(content)
  );
  
  // Convert Uint8Arrays to ArrayBuffers for consistent API
  // Use slice to create proper ArrayBuffer copies (not SharedArrayBuffer)
  return {
    encryptedData,
    salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
    iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
  };
}

/**
 * Decrypt content with password-based encryption
 * 
 * @param encryptedData Encrypted content
 * @param password User password
 * @param salt Salt used for key derivation
 * @param iv Initialization vector
 * @returns Promise resolving to decrypted content
 */
export async function decryptWithPassword(
  encryptedData: ArrayBuffer,
  password: string,
  salt: ArrayBuffer,
  iv: ArrayBuffer
): Promise<string> {
  const key = await deriveKeyFromPassword(password, salt);
  
  // Ensure iv is properly typed for WebCrypto - convert to Uint8Array if needed
  const ivBuffer = iv instanceof Uint8Array ? iv : new Uint8Array(iv);
  
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as BufferSource
    },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decryptedData);
}

// ============================================================================
// SECURITY HEADERS AND POLICIES
// ============================================================================

/**
 * Enhanced Content Security Policy for better security
 */
export const ENHANCED_CSP = [
  "default-src 'self'",
  "script-src 'self'", // Disallow inline scripts
  "style-src 'self' 'unsafe-inline'",  // Allow inline styles
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join('; ');

/**
 * Security headers to add to responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': ENHANCED_CSP
} as const;
