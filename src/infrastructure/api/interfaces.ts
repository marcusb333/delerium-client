/**
 * API Client Interface
 * Allows swapping API implementations (fetch, axios, mock)
 */

import { PasteMeta } from '../../core/models/paste.js';

/**
 * Proof-of-work solution
 */
export interface PowSolution {
  challenge: string;
  nonce: number;
}

/**
 * Proof-of-work challenge from server
 */
export interface PowChallenge {
  challenge: string;
  difficulty: number;
}

/**
 * Request to create a paste
 */
export interface PasteCreateRequest {
  /** Base64url-encoded ciphertext */
  ct: string;
  /** Base64url-encoded IV */
  iv: string;
  /** Paste metadata */
  meta: {
    expireTs: number;
    viewsAllowed?: number;
    singleView?: boolean;
    mime?: string;
  };
  /** Proof-of-work solution (if required) */
  pow?: PowSolution;
}

/**
 * Response from creating a paste
 */
export interface PasteCreateResponse {
  /** Paste ID */
  id: string;
  /** Deletion token */
  deleteToken: string;
}

/**
 * Response from retrieving a paste
 */
export interface PasteRetrieveResponse {
  /** Base64url-encoded ciphertext */
  ct: string;
  /** Base64url-encoded IV */
  iv: string;
  /** Metadata */
  meta: PasteMeta;
  /** Views remaining */
  viewsLeft?: number;
}

/**
 * API Client Interface
 */
export interface IApiClient {
  /**
   * Create a new paste
   */
  createPaste(request: PasteCreateRequest): Promise<PasteCreateResponse>;

  /**
   * Retrieve a paste by ID
   */
  retrievePaste(id: string): Promise<PasteRetrieveResponse>;

  /**
   * Delete a paste
   */
  deletePaste(id: string, token: string): Promise<void>;

  /**
   * Get PoW challenge (returns null if PoW disabled)
   */
  getPowChallenge(): Promise<PowChallenge | null>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}
