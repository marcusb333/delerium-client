/**
 * API module public API
 */

export {
  IApiClient,
  PowChallenge,
  PowSolution,
  PasteCreateRequest,
  PasteCreateResponse,
  PasteRetrieveResponse
} from './interfaces.js';
export { HttpApiClient } from './http-client.js';

import { HttpApiClient } from './http-client.js';
import { IApiClient } from './interfaces.js';

/**
 * Factory function for creating API client
 */
export function createApiClient(baseUrl: string = '/api'): IApiClient {
  return new HttpApiClient(baseUrl);
}
