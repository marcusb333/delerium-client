/**
 * Paste domain models
 */

/**
 * Paste options when creating a new paste
 */
export interface PasteOptions {
  /** Expiration time in minutes */
  expirationMinutes: number;
  /** Maximum number of views allowed */
  maxViews?: number;
  /** Delete after first view */
  singleView: boolean;
  /** Password protection enabled */
  hasPassword: boolean;
}

/**
 * Paste metadata
 */
export interface PasteMeta {
  /** Unix timestamp when paste expires */
  expirationMinutes: number;
  /** Maximum views allowed */
  maxViews?: number;
  /** Delete after single view */
  singleView: boolean;
  /** Has password protection */
  hasPassword: boolean;
  /** MIME type hint */
  mime?: string;
}

/**
 * Encrypted paste data
 */
export interface EncryptedPaste {
  /** Base64url-encoded ciphertext */
  ciphertext: string;
  /** Base64url-encoded IV */
  iv: string;
  /** Metadata */
  meta: PasteMeta;
}

/**
 * Paste creation result
 */
export interface PasteCreated {
  /** Paste ID */
  id: string;
  /** Deletion token */
  deleteToken: string;
  /** Shareable URL with encryption key in fragment */
  shareUrl: string;
  /** Deletion URL */
  deleteUrl: string;
}
