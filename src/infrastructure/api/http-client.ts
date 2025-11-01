/**
 * HTTP API Client Implementation
 * Uses fetch API for HTTP requests
 */

import {
  IApiClient,
  PasteCreateRequest,
  PasteCreateResponse,
  PasteRetrieveResponse,
  PowChallenge
} from './interfaces.js';

// Note: These are now aliases to the core domain models

/**
 * HTTP-based API client using fetch
 */
export class HttpApiClient implements IApiClient {
  constructor(private baseUrl: string = '/api') {}

  /**
   * Create a new paste
   */
  async createPaste(request: PasteCreateRequest): Promise<PasteCreateResponse> {
    const response = await fetch(`${this.baseUrl}/pastes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Retrieve a paste by ID
   */
  async retrievePaste(id: string): Promise<PasteRetrieveResponse> {
    const response = await fetch(`${this.baseUrl}/pastes/${encodeURIComponent(id)}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Content not found or has expired');
      }
      if (response.status === 410) {
        throw new Error('Content has expired');
      }
      throw new Error('Failed to retrieve content');
    }

    return response.json();
  }

  /**
   * Delete a paste
   */
  async deletePaste(id: string, token: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/pastes/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
      { method: 'DELETE' }
    );

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Invalid token or paste not found');
    }
  }

  /**
   * Get PoW challenge
   */
  async getPowChallenge(): Promise<PowChallenge | null> {
    const response = await fetch(`${this.baseUrl}/pow`);

    if (response.status === 204) {
      return null; // PoW disabled
    }

    if (!response.ok) {
      throw new Error('Failed to fetch PoW challenge');
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/pow`, { method: 'HEAD' });
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  }
}
