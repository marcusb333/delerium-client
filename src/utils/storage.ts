/**
 * storage.ts - Browser storage utilities
 * 
 * Provides safe access to sessionStorage and localStorage with fallbacks
 * and delete token management for paste deletion.
 */

const DELETE_TOKEN_STORAGE_PREFIX = 'deleteToken_';

/**
 * Safely access sessionStorage with error handling
 */
export function sessionStorageSafe(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Safely access localStorage with error handling
 */
export function localStorageSafe(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Store a delete token for a paste in sessionStorage
 * Also cleans up any legacy tokens in localStorage
 */
export function storeDeleteToken(id: string, token: string): void {
  const key = `${DELETE_TOKEN_STORAGE_PREFIX}${id}`;
  const storage = sessionStorageSafe();
  if (storage) {
    try {
      storage.setItem(key, token);
    } catch {
      // Ignore storage quota/security errors
    }
  }
  const legacy = localStorageSafe();
  if (legacy) {
    try {
      legacy.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Retrieve a delete token for a paste
 * Checks sessionStorage first, then migrates from localStorage if found
 */
export function getDeleteToken(id: string): string | null {
  const key = `${DELETE_TOKEN_STORAGE_PREFIX}${id}`;
  const storage = sessionStorageSafe();
  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value) {
        return value;
      }
    } catch {
      // Ignore access errors
    }
  }
  const legacy = localStorageSafe();
  if (legacy) {
    try {
      const value = legacy.getItem(key);
      if (value) {
        // Migrate to session storage if available
        if (storage) {
          try {
            storage.setItem(key, value);
          } catch {
            // Ignore migration failures
          }
        }
        legacy.removeItem(key);
        return value;
      }
    } catch {
      // Ignore access errors
    }
  }
  return null;
}

/**
 * Remove a delete token for a paste from both storages
 */
export function removeDeleteToken(id: string): void {
  const key = `${DELETE_TOKEN_STORAGE_PREFIX}${id}`;
  const storage = sessionStorageSafe();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore access errors
    }
  }
  const legacy = localStorageSafe();
  if (legacy) {
    try {
      legacy.removeItem(key);
    } catch {
      // Ignore access errors
    }
  }
}
