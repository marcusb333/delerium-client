declare const encryptString: (text: string) => Promise<any>;
declare const decryptParts: (keyB64: string, ivB64: string, ctB64: string) => Promise<string>;
declare const b64u: (arr: Uint8Array | ArrayBuffer) => string;
declare const ub64u: (str: string) => Uint8Array;
/**
 * Encryption Flow Integration Tests
 *
 * Tests the complete encryption/decryption workflow that forms the core
 * of the zero-knowledge paste system. These tests verify that the entire
 * encryption pipeline works correctly from start to finish.
 *
 * Tested Workflows:
 * - Complete encrypt-decrypt cycle with real data
 * - Base64 URL encoding/decoding for URL transmission
 * - Unicode and large text handling
 * - Performance and timing validation
 * - Error handling and edge cases
 *
 * These tests ensure that:
 * 1. Data encrypted on one end can be decrypted on the other
 * 2. The encoding/decoding process preserves data integrity
 * 3. The system handles various data types and sizes correctly
 * 4. Performance remains acceptable for typical use cases
 * 5. Error conditions are handled gracefully
 */
declare const mockCryptoKey: CryptoKey;
declare const mockGenerateKey: jest.Mock<any, any, any>;
declare const mockImportKey: jest.Mock<any, any, any>;
declare const mockExportKey: jest.Mock<any, any, any>;
declare const mockEncrypt: jest.Mock<any, any, any>;
declare const mockDecrypt: jest.Mock<any, any, any>;
declare const mockGetRandomValues: jest.Mock<any, any, any>;
//# sourceMappingURL=encryption-flow.test.d.ts.map