/**
 * Validators module public API
 * Privacy-preserving validation without content analysis
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Constants
export const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB
export const MAX_EXPIRATION_MINUTES = 7 * 24 * 60; // 7 days
export const MIN_EXPIRATION_MINUTES = 1;
export const MAX_VIEW_COUNT = 100;
export const MIN_VIEW_COUNT = 1;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate content size without reading content
 */
export function validateContentSize(content: string): ValidationResult {
  if (!content || content.length === 0) {
    return { isValid: false, error: 'Content cannot be empty' };
  }

  const byteLength = new TextEncoder().encode(content).length;
  if (byteLength > MAX_CONTENT_SIZE) {
    return {
      isValid: false,
      error: `Content too large (${Math.round(byteLength / 1024)}KB, max ${Math.round(MAX_CONTENT_SIZE / 1024)}KB)`
    };
  }

  return { isValid: true };
}

/**
 * Validate expiration time
 */
export function validateExpiration(minutes: number): ValidationResult {
  if (!Number.isInteger(minutes) || minutes < MIN_EXPIRATION_MINUTES) {
    return {
      isValid: false,
      error: `Expiration must be at least ${MIN_EXPIRATION_MINUTES} minute(s)`
    };
  }

  if (minutes > MAX_EXPIRATION_MINUTES) {
    return {
      isValid: false,
      error: `Expiration cannot exceed ${MAX_EXPIRATION_MINUTES} minutes (7 days)`
    };
  }

  return { isValid: true };
}

/**
 * Validate view count
 */
export function validateViewCount(views: number): ValidationResult {
  if (!Number.isInteger(views) || views < MIN_VIEW_COUNT) {
    return { isValid: false, error: 'View count must be at least 1' };
  }

  if (views > MAX_VIEW_COUNT) {
    return { isValid: false, error: `View count cannot exceed ${MAX_VIEW_COUNT}` };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`
    };
  }

  // Check for common weak passwords
  const commonPatterns = [
    /^password$/i,
    /^12345678$/,
    /^qwerty$/i,
    /^admin$/i,
    /^letmein$/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    return {
      isValid: false,
      error: 'Password is too common. Please choose a stronger password'
    };
  }

  return { isValid: true };
}

/**
 * Check if string is valid UTF-8
 */
export function isValidUTF8(str: string): boolean {
  try {
    const encoded = new TextEncoder().encode(str);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
    return decoded === str;
  } catch {
    return false;
  }
}
