// Jest setup file for DOM environment

// Import Node.js crypto for real implementations
const nodeCrypto = require('crypto');
const { webcrypto } = nodeCrypto;

// Use Node.js Web Crypto API implementation (Node 15.10.0+)
if (webcrypto && webcrypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: webcrypto.subtle,
      getRandomValues: (arr: Uint8Array) => {
        return nodeCrypto.randomFillSync(arr);
      },
    },
  });
} else {
  // Fallback for older Node versions
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        generateKey: jest.fn(),
        importKey: jest.fn(),
        exportKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        digest: jest.fn(),
        deriveKey: jest.fn(),
      },
      getRandomValues: jest.fn((arr: Uint8Array) => {
        return nodeCrypto.randomFillSync(arr);
      }),
    },
  });
}

// Mock TextEncoder and TextDecoder using a different approach
const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require('util');
(global as any).TextEncoder = NodeTextEncoder;
(global as any).TextDecoder = NodeTextDecoder;

// Mock btoa and atob
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Ensure fetch is available (Node.js 18+ has it built-in)
// Node.js 18+ has fetch built-in, but Jest/jsdom might not expose it
if (typeof global.fetch === 'undefined') {
  // Try to use Node.js built-in fetch
  try {
    // In Node.js 18+, fetch is available as a global, but we need to import it
    // For Jest, we'll use a simple HTTP client approach
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    // Simple fetch polyfill using Node.js http/https
    (global as any).fetch = async (url: string, options: any = {}) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const method = options.method || 'GET';
      const headers = options.headers || {};
      
      return new Promise((resolve, reject) => {
        const req = client.request(url, {
          method,
          headers,
        }, (res: any) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              json: async () => JSON.parse(body),
              text: async () => body,
            });
          });
        });
        
        req.on('error', reject);
        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });
    };
  } catch (error) {
    console.warn('Failed to set up fetch polyfill:', error);
  }
}