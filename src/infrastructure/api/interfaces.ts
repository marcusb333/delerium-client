/**
 * API Client Interface
 * Allows swapping API implementations (fetch, axios, mock)
 */

import {
  PowChallenge,
  PowSolution,
  CreatePasteRequest,
  CreatePasteResponse,
  GetPasteResponse
} from '../../core/models/paste.js';

// Re-export types for convenience
export type {
  PowChallenge,
  PowSolution,
  CreatePasteRequest,
  CreatePasteResponse,
  GetPasteResponse
};

// Legacy aliases for backward compatibility
export type PasteCreateRequest = CreatePasteRequest;
export type PasteCreateResponse = CreatePasteResponse;
export type PasteRetrieveResponse = GetPasteResponse;

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
