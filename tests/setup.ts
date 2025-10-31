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