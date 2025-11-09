/**
 * Unit tests for PoW Solver implementations
 *
 * Tests the InlinePowSolver to ensure it correctly solves
 * proof-of-work challenges using SHA-256 hashing.
 */
import { InlinePowSolver } from '../../../src/infrastructure/pow/inline-solver.js';
describe('InlinePowSolver', () => {
    let solver;
    beforeEach(() => {
        solver = new InlinePowSolver();
    });
    describe('solve', () => {
        it('should solve a simple PoW challenge (difficulty 1)', async () => {
            const challenge = {
                challenge: 'test-challenge-1',
                difficulty: 1
            };
            const solution = await solver.solve(challenge);
            expect(solution.challenge).toBe(challenge.challenge);
            expect(solution.nonce).toBeGreaterThanOrEqual(0);
            // Verify the solution is valid
            const text = `${solution.challenge}:${solution.nonce}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = new Uint8Array(hashBuffer);
            // Count leading zero bits
            let bits = 0;
            for (const byte of hashArray) {
                if (byte === 0) {
                    bits += 8;
                    continue;
                }
                bits += Math.clz32(byte) - 24;
                break;
            }
            expect(bits).toBeGreaterThanOrEqual(challenge.difficulty);
        });
        it('should solve a moderate PoW challenge (difficulty 4)', async () => {
            const challenge = {
                challenge: 'test-challenge-moderate',
                difficulty: 4
            };
            const solution = await solver.solve(challenge);
            expect(solution.challenge).toBe(challenge.challenge);
            expect(solution.nonce).toBeGreaterThanOrEqual(0);
            // Verify the solution is valid
            const text = `${solution.challenge}:${solution.nonce}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = new Uint8Array(hashBuffer);
            let bits = 0;
            for (const byte of hashArray) {
                if (byte === 0) {
                    bits += 8;
                    continue;
                }
                bits += Math.clz32(byte) - 24;
                break;
            }
            expect(bits).toBeGreaterThanOrEqual(challenge.difficulty);
        }, 10000); // 10 second timeout for moderate difficulty
        it('should solve different challenges with different nonces', async () => {
            const challenge1 = {
                challenge: 'challenge-a',
                difficulty: 2
            };
            const challenge2 = {
                challenge: 'challenge-b',
                difficulty: 2
            };
            const solution1 = await solver.solve(challenge1);
            const solution2 = await solver.solve(challenge2);
            expect(solution1.challenge).toBe(challenge1.challenge);
            expect(solution2.challenge).toBe(challenge2.challenge);
            // Different challenges should (very likely) have different nonces
            // This is probabilistic but extremely likely
            expect(solution1.nonce).not.toBe(solution2.nonce);
        });
        it('should handle difficulty 0 (always valid)', async () => {
            const challenge = {
                challenge: 'easy-challenge',
                difficulty: 0
            };
            const solution = await solver.solve(challenge);
            expect(solution.challenge).toBe(challenge.challenge);
            expect(solution.nonce).toBe(0); // Should find solution immediately
        });
        it('should be cancellable', async () => {
            const challenge = {
                challenge: 'long-challenge',
                difficulty: 20 // Very high difficulty, will take a long time
            };
            const solvePromise = solver.solve(challenge);
            // Cancel after a short delay
            setTimeout(() => solver.cancel(), 10);
            await expect(solvePromise).rejects.toThrow('PoW solving cancelled');
        });
        it('should reset cancelled state for new solve', async () => {
            const challenge1 = {
                challenge: 'first-challenge',
                difficulty: 15
            };
            const challenge2 = {
                challenge: 'second-challenge',
                difficulty: 1
            };
            // Start and cancel first solve
            const solvePromise1 = solver.solve(challenge1);
            setTimeout(() => solver.cancel(), 5);
            await expect(solvePromise1).rejects.toThrow('PoW solving cancelled');
            // Second solve should work
            const solution2 = await solver.solve(challenge2);
            expect(solution2.challenge).toBe(challenge2.challenge);
            expect(solution2.nonce).toBeGreaterThanOrEqual(0);
        });
    });
    describe('cancel', () => {
        it('should be safe to call cancel when not solving', () => {
            expect(() => solver.cancel()).not.toThrow();
        });
        it('should be safe to call cancel multiple times', async () => {
            const challenge = {
                challenge: 'test',
                difficulty: 15
            };
            const solvePromise = solver.solve(challenge);
            solver.cancel();
            solver.cancel();
            solver.cancel();
            await expect(solvePromise).rejects.toThrow('PoW solving cancelled');
        });
    });
    describe('hash verification', () => {
        it('should produce valid SHA-256 hashes', async () => {
            const challenge = {
                challenge: 'hash-test',
                difficulty: 2
            };
            const solution = await solver.solve(challenge);
            // Manually verify the hash
            const text = `${solution.challenge}:${solution.nonce}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = new Uint8Array(hashBuffer);
            // Should be 32 bytes (256 bits)
            expect(hashArray.length).toBe(32);
            // Verify leading zero bits
            let bits = 0;
            for (const byte of hashArray) {
                if (byte === 0) {
                    bits += 8;
                    continue;
                }
                bits += Math.clz32(byte) - 24;
                break;
            }
            expect(bits).toBeGreaterThanOrEqual(challenge.difficulty);
        });
    });
    describe('performance', () => {
        it('should solve low difficulty challenges quickly', async () => {
            const challenge = {
                challenge: 'speed-test',
                difficulty: 3
            };
            const startTime = Date.now();
            await solver.solve(challenge);
            const endTime = Date.now();
            // Should complete in under 5 seconds for difficulty 3
            expect(endTime - startTime).toBeLessThan(5000);
        });
        it('should yield periodically to avoid blocking', async () => {
            const challenge = {
                challenge: 'yield-test',
                difficulty: 10
            };
            let yieldCount = 0;
            const originalSetTimeout = global.setTimeout;
            // Mock setTimeout to detect yielding
            global.setTimeout = jest.fn((callback, delay) => {
                if (delay === 0) {
                    yieldCount++;
                }
                return originalSetTimeout(callback, delay);
            });
            try {
                await solver.solve(challenge);
                // Should yield at least once for difficulty 10
                expect(yieldCount).toBeGreaterThan(0);
            }
            finally {
                global.setTimeout = originalSetTimeout;
            }
        }, 20000); // 20 second timeout
    });
});
//# sourceMappingURL=pow-solver.test.js.map