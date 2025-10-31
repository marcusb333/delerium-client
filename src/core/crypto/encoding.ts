/**
 * Base64url encoding/decoding utilities
 * Base64url is URL-safe (uses - and _ instead of + and /)
 */

/**
 * Encode bytes to base64url format
 * 
 * @param bytes Binary data to encode
 * @returns Base64url-encoded string without padding
 */
export function encodeBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...uint8Array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode base64url format to bytes
 * 
 * @param s Base64url-encoded string
 * @returns Decoded binary data as ArrayBuffer
 */
export function decodeBase64Url(s: string): ArrayBuffer {
  let padded = s.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) {
    padded += '=';
  }
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out.buffer;
}
