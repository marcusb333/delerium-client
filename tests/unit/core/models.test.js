/**
 * Unit tests for core/models/paste.ts
 *
 * Tests domain models and type definitions:
 * - EncryptedData interface
 * - PowChallenge interface
 * - PowSolution interface
 * - PasteMetadata interface
 * - API request/response types
 */
// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================
describe('EncryptedData', () => {
    it('should have correct structure', () => {
        const encrypted = {
            keyB64: 'test-key',
            ivB64: 'test-iv',
            ctB64: 'test-ciphertext'
        };
        expect(encrypted.keyB64).toBe('test-key');
        expect(encrypted.ivB64).toBe('test-iv');
        expect(encrypted.ctB64).toBe('test-ciphertext');
    });
    it('should accept base64url-encoded strings', () => {
        const encrypted = {
            keyB64: 'YWJjZGVmZ2hpams',
            ivB64: 'MTIzNDU2Nzg5MGFi',
            ctB64: 'dGVzdC1jaXBoZXJ0ZXh0'
        };
        expect(encrypted.keyB64).toBeTruthy();
        expect(encrypted.ivB64).toBeTruthy();
        expect(encrypted.ctB64).toBeTruthy();
    });
});
describe('PowChallenge', () => {
    it('should have correct structure', () => {
        const challenge = {
            challenge: 'test-challenge',
            difficulty: 5
        };
        expect(challenge.challenge).toBe('test-challenge');
        expect(challenge.difficulty).toBe(5);
    });
    it('should accept valid difficulty values', () => {
        const challenges = [
            { challenge: 'test1', difficulty: 1 },
            { challenge: 'test2', difficulty: 10 },
            { challenge: 'test3', difficulty: 20 }
        ];
        challenges.forEach(ch => {
            expect(ch.challenge).toBeTruthy();
            expect(ch.difficulty).toBeGreaterThan(0);
        });
    });
});
describe('PowSolution', () => {
    it('should have correct structure', () => {
        const solution = {
            challenge: 'test-challenge',
            nonce: 12345
        };
        expect(solution.challenge).toBe('test-challenge');
        expect(solution.nonce).toBe(12345);
    });
    it('should accept large nonce values', () => {
        const solution = {
            challenge: 'test-challenge',
            nonce: 4294967295 // Max 32-bit unsigned int
        };
        expect(solution.nonce).toBeGreaterThan(0);
    });
});
describe('PasteMetadata', () => {
    it('should have correct structure', () => {
        const now = Math.floor(Date.now() / 1000);
        const metadata = {
            expireTs: now + 3600,
            singleView: false,
            viewsAllowed: 10,
            mime: 'text/plain'
        };
        expect(metadata.expireTs).toBeGreaterThan(now);
        expect(metadata.singleView).toBe(false);
        expect(metadata.viewsAllowed).toBe(10);
        expect(metadata.mime).toBe('text/plain');
    });
    it('should handle single-view pastes', () => {
        const metadata = {
            expireTs: Math.floor(Date.now() / 1000) + 3600,
            singleView: true,
            viewsAllowed: 1,
            mime: 'text/plain'
        };
        expect(metadata.singleView).toBe(true);
        expect(metadata.viewsAllowed).toBe(1);
    });
    it('should accept different MIME types', () => {
        const mimeTypes = ['text/plain', 'text/html', 'application/json', 'text/markdown'];
        mimeTypes.forEach(mime => {
            const metadata = {
                expireTs: Math.floor(Date.now() / 1000) + 3600,
                singleView: false,
                viewsAllowed: 10,
                mime
            };
            expect(metadata.mime).toBe(mime);
        });
    });
    it('should handle future expiration times', () => {
        const futureExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
        const metadata = {
            expireTs: futureExpiry,
            singleView: false,
            viewsAllowed: 100,
            mime: 'text/plain'
        };
        expect(metadata.expireTs).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
});
describe('CreatePasteRequest', () => {
    it('should have correct structure', () => {
        const request = {
            ct: 'ciphertext',
            iv: 'initialization-vector',
            meta: {
                expireTs: Math.floor(Date.now() / 1000) + 3600,
                singleView: false,
                viewsAllowed: 10,
                mime: 'text/plain'
            },
            pow: null
        };
        expect(request.ct).toBeTruthy();
        expect(request.iv).toBeTruthy();
        expect(request.meta).toBeTruthy();
        expect(request.pow).toBeNull();
    });
    it('should accept PowSolution', () => {
        const request = {
            ct: 'ciphertext',
            iv: 'initialization-vector',
            meta: {
                expireTs: Math.floor(Date.now() / 1000) + 3600,
                singleView: false,
                viewsAllowed: 10,
                mime: 'text/plain'
            },
            pow: {
                challenge: 'test-challenge',
                nonce: 12345
            }
        };
        expect(request.pow).toBeTruthy();
        expect(request.pow?.challenge).toBe('test-challenge');
        expect(request.pow?.nonce).toBe(12345);
    });
    it('should allow optional pow field', () => {
        const request = {
            ct: 'ciphertext',
            iv: 'initialization-vector',
            meta: {
                expireTs: Math.floor(Date.now() / 1000) + 3600,
                singleView: false,
                viewsAllowed: 10,
                mime: 'text/plain'
            }
        };
        expect(request.pow).toBeUndefined();
    });
});
describe('CreatePasteResponse', () => {
    it('should have correct structure', () => {
        const response = {
            id: 'abc123',
            deleteToken: 'token-xyz'
        };
        expect(response.id).toBeTruthy();
        expect(response.deleteToken).toBeTruthy();
    });
    it('should accept various ID formats', () => {
        const responses = [
            { id: 'short', deleteToken: 'token' },
            { id: 'a'.repeat(32), deleteToken: 'token' },
            { id: 'mixed-123-ABC', deleteToken: 'token' }
        ];
        responses.forEach(res => {
            expect(res.id).toBeTruthy();
            expect(res.deleteToken).toBeTruthy();
        });
    });
});
describe('GetPasteResponse', () => {
    it('should have correct structure', () => {
        const response = {
            ct: 'ciphertext',
            iv: 'initialization-vector',
            meta: {
                expireTs: Math.floor(Date.now() / 1000) + 3600,
                singleView: false,
                viewsAllowed: 10,
                mime: 'text/plain'
            }
        };
        expect(response.ct).toBeTruthy();
        expect(response.iv).toBeTruthy();
        expect(response.meta).toBeTruthy();
    });
});
describe('PasteOptions', () => {
    it('should have correct structure', () => {
        const options = {
            expirationMinutes: 60,
            maxViews: 10,
            singleView: false,
            hasPassword: false
        };
        expect(options.expirationMinutes).toBe(60);
        expect(options.maxViews).toBe(10);
        expect(options.singleView).toBe(false);
        expect(options.hasPassword).toBe(false);
    });
    it('should allow optional maxViews', () => {
        const options = {
            expirationMinutes: 60,
            singleView: true,
            hasPassword: false
        };
        expect(options.maxViews).toBeUndefined();
    });
    it('should handle all combinations', () => {
        const combinations = [
            { expirationMinutes: 1, singleView: false, hasPassword: false, maxViews: 1 },
            { expirationMinutes: 60, singleView: true, hasPassword: false },
            { expirationMinutes: 1440, singleView: false, hasPassword: true, maxViews: 100 }
        ];
        combinations.forEach(opts => {
            expect(opts.expirationMinutes).toBeGreaterThan(0);
            expect(typeof opts.singleView).toBe('boolean');
            expect(typeof opts.hasPassword).toBe('boolean');
        });
    });
});
describe('PasteCreated', () => {
    it('should have correct structure', () => {
        const created = {
            id: 'abc123',
            deleteToken: 'token-xyz',
            shareUrl: 'https://example.com/view.html?p=abc123#key:iv',
            deleteUrl: 'https://example.com/delete.html?p=abc123&token=token-xyz'
        };
        expect(created.id).toBeTruthy();
        expect(created.deleteToken).toBeTruthy();
        expect(created.shareUrl).toContain('view.html');
        expect(created.deleteUrl).toContain('delete.html');
    });
    it('should have URLs containing the paste ID', () => {
        const created = {
            id: 'test-id-123',
            deleteToken: 'token',
            shareUrl: 'https://example.com/view.html?p=test-id-123#key',
            deleteUrl: 'https://example.com/delete.html?p=test-id-123&token=token'
        };
        expect(created.shareUrl).toContain(created.id);
        expect(created.deleteUrl).toContain(created.id);
        expect(created.deleteUrl).toContain(created.deleteToken);
    });
});
// ============================================================================
// TYPE COMPATIBILITY TESTS
// ============================================================================
describe('Type Compatibility', () => {
    it('should allow PowChallenge to be used with PowSolution', () => {
        const challenge = {
            challenge: 'test-challenge',
            difficulty: 5
        };
        const solution = {
            challenge: challenge.challenge,
            nonce: 12345
        };
        expect(solution.challenge).toBe(challenge.challenge);
    });
    it('should allow PasteMetadata in CreatePasteRequest and GetPasteResponse', () => {
        const meta = {
            expireTs: Math.floor(Date.now() / 1000) + 3600,
            singleView: false,
            viewsAllowed: 10,
            mime: 'text/plain'
        };
        const request = {
            ct: 'ciphertext',
            iv: 'iv',
            meta
        };
        const response = {
            ct: 'ciphertext',
            iv: 'iv',
            meta
        };
        expect(request.meta).toEqual(meta);
        expect(response.meta).toEqual(meta);
    });
});
export {};
//# sourceMappingURL=models.test.js.map