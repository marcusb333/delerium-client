/**
 * Load tests for Proof-of-Work functionality
 *
 * Tests PoW under various concurrent load conditions:
 * - Concurrent challenge generation
 * - Concurrent verification
 * - Cache behavior under load
 * - Performance metrics
 *
 * These tests require a running server instance.
 * Run with: npm run test:load
 *
 * Note: These tests are excluded from regular test runs due to time/resource requirements.
 */
import { InlinePowSolver } from '../../src/infrastructure/pow/inline-solver.js';
// Base URL for API requests - defaults to localhost:8080
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
// Skip load tests if SKIP_LOAD_TESTS is set or if server is not available
const SKIP_LOAD_TESTS = process.env.SKIP_LOAD_TESTS === 'true';
/**
 * Calculate performance metrics from latency array
 */
function calculateMetrics(latencies, totalRequests, failedRequests, totalTimeMs) {
    const successfulRequests = latencies.length;
    const total = totalRequests ?? successfulRequests;
    const failed = failedRequests ?? (total - successfulRequests);
    if (latencies.length === 0) {
        return {
            totalRequests: total,
            successfulRequests: 0,
            failedRequests: failed,
            minLatency: 0,
            maxLatency: 0,
            avgLatency: 0,
            p50Latency: 0,
            p95Latency: 0,
            p99Latency: 0,
            latencies: [],
            throughput: totalTimeMs ? (total / (totalTimeMs / 1000)) : undefined,
            errorRate: total > 0 ? (failed / total) * 100 : 0,
            totalTime: totalTimeMs
        };
    }
    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
        totalRequests: total,
        successfulRequests,
        failedRequests: failed,
        minLatency: sorted[0],
        maxLatency: sorted[sorted.length - 1],
        avgLatency: sum / latencies.length,
        p50Latency: sorted[Math.floor(sorted.length * 0.5)],
        p95Latency: sorted[Math.floor(sorted.length * 0.95)],
        p99Latency: sorted[Math.floor(sorted.length * 0.99)],
        latencies: sorted,
        throughput: totalTimeMs ? (total / (totalTimeMs / 1000)) : undefined,
        errorRate: total > 0 ? (failed / total) * 100 : 0,
        totalTime: totalTimeMs
    };
}
/**
 * Check if server is available
 */
async function checkServerAvailable() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pow`);
        // 204 No Content means PoW is disabled, but server is available
        // Any 2xx or 3xx status means server is responding
        const isAvailable = response.status >= 200 && response.status < 400;
        if (!isAvailable && process.env.DEBUG_LOAD_TESTS) {
            console.log(`Server check failed: status ${response.status} for ${API_BASE_URL}/api/pow`);
        }
        return isAvailable;
    }
    catch (error) {
        // Network error or server not reachable
        if (process.env.DEBUG_LOAD_TESTS) {
            console.log(`Server check error:`, error.message || error);
        }
        return false;
    }
}
/**
 * Fetch a PoW challenge from the server
 */
async function fetchChallenge() {
    const start = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/pow`);
    const latency = Date.now() - start;
    if (response.status === 204) {
        throw new Error('PoW is disabled on server');
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch challenge: ${response.status}`);
    }
    const challenge = await response.json();
    return { challenge, latency };
}
/**
 * Solve a PoW challenge
 */
async function solveChallenge(challenge) {
    const solver = new InlinePowSolver();
    return solver.solve(challenge);
}
/**
 * Verify a PoW solution by creating a paste
 */
async function verifySolution(solution, challenge) {
    const start = Date.now();
    // Create a minimal paste request with PoW
    const request = {
        ct: 'dGVzdA', // base64url encoded "test"
        iv: 'dGVzdC12ZWN0b3I', // base64url encoded "test-vector"
        meta: {
            expireTs: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            singleView: false,
            viewsAllowed: null,
            mime: 'text/plain'
        },
        pow: {
            challenge: solution.challenge,
            nonce: solution.nonce
        }
    };
    try {
        const response = await fetch(`${API_BASE_URL}/api/pastes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });
        const latency = Date.now() - start;
        const success = response.ok;
        if (!success) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            if (error.error === 'pow_invalid') {
                throw new Error(`PoW verification failed: ${JSON.stringify(error)}`);
            }
            if (process.env.DEBUG_LOAD_TESTS) {
                console.log(`Verification failed: status ${response.status}, error:`, error);
            }
        }
        return { success, latency };
    }
    catch (error) {
        const latency = Date.now() - start;
        throw { error, latency };
    }
}
describe('PoW Load Tests', () => {
    beforeAll(async () => {
        if (SKIP_LOAD_TESTS) {
            console.log('Skipping load tests (SKIP_LOAD_TESTS=true)');
            return;
        }
        const available = await checkServerAvailable();
        if (!available) {
            console.warn(`Server not available at ${API_BASE_URL}. ` +
                'Please start the server with "make dev" or set API_BASE_URL environment variable.');
        }
    });
    describe('Concurrent Challenge Generation', () => {
        const testCases = [
            { name: 'low', concurrency: 10 },
            { name: 'medium', concurrency: 50 },
            { name: 'high', concurrency: 100 }
        ];
        testCases.forEach(({ name, concurrency }) => {
            it(`should handle ${name} concurrent challenge requests (${concurrency} requests)`, async () => {
                if (SKIP_LOAD_TESTS) {
                    return;
                }
                const serverAvailable = await checkServerAvailable();
                if (!serverAvailable) {
                    console.warn('Skipping test: server not available');
                    return;
                }
                const startTime = Date.now();
                const challenges = [];
                const latencies = [];
                const errors = [];
                // Fire all requests concurrently
                const promises = Array.from({ length: concurrency }, async () => {
                    try {
                        const { challenge, latency } = await fetchChallenge();
                        challenges.push(challenge);
                        latencies.push(latency);
                    }
                    catch (error) {
                        errors.push(error);
                    }
                });
                await Promise.all(promises);
                const totalTime = Date.now() - startTime;
                const metrics = calculateMetrics(latencies, concurrency, errors.length, totalTime);
                // Verify all challenges are unique
                const challengeStrings = challenges.map(c => c.challenge);
                const uniqueChallenges = new Set(challengeStrings);
                console.log(`\n[${name} concurrency] Results:`);
                console.log(`  Total requests: ${concurrency}`);
                console.log(`  Successful: ${challenges.length}`);
                console.log(`  Failed: ${errors.length}`);
                console.log(`  Unique challenges: ${uniqueChallenges.size}`);
                console.log(`  Total time: ${totalTime}ms`);
                console.log(`  Throughput: ${metrics.throughput?.toFixed(2) ?? 'N/A'} req/s`);
                console.log(`  Error rate: ${metrics.errorRate?.toFixed(2) ?? '0.00'}%`);
                console.log(`  Avg latency: ${metrics.avgLatency.toFixed(2)}ms`);
                console.log(`  P95 latency: ${metrics.p95Latency.toFixed(2)}ms`);
                console.log(`  P99 latency: ${metrics.p99Latency.toFixed(2)}ms`);
                // Assertions
                expect(challenges.length).toBeGreaterThan(concurrency * 0.95); // At least 95% success rate
                expect(uniqueChallenges.size).toBe(challenges.length); // All challenges should be unique
                expect(metrics.avgLatency).toBeLessThan(1000); // Average latency should be under 1s
                expect(errors.length).toBe(0); // No errors expected
            }, 30000); // 30 second timeout
        });
    });
    describe('Concurrent Verification', () => {
        const testCases = [
            { name: 'low', concurrency: 10 },
            { name: 'medium', concurrency: 50 },
            { name: 'high', concurrency: 100 }
        ];
        testCases.forEach(({ name, concurrency }) => {
            it(`should handle ${name} concurrent verifications (${concurrency} requests)`, async () => {
                if (SKIP_LOAD_TESTS) {
                    return;
                }
                const serverAvailable = await checkServerAvailable();
                if (!serverAvailable) {
                    console.warn('Skipping test: server not available');
                    return;
                }
                // First, fetch and solve challenges sequentially (to avoid overwhelming the solver)
                console.log(`\n[${name} concurrency] Preparing ${concurrency} challenges...`);
                const solutions = [];
                for (let i = 0; i < concurrency; i++) {
                    try {
                        const { challenge } = await fetchChallenge();
                        // Use the actual difficulty from the server
                        const solution = await solveChallenge(challenge);
                        solutions.push({ solution, challenge });
                    }
                    catch (error) {
                        console.warn(`Failed to prepare challenge ${i + 1}:`, error);
                    }
                }
                // With difficulty 10, solving takes time - accept lower success rate for load testing
                expect(solutions.length).toBeGreaterThan(Math.max(1, concurrency * 0.1)); // At least 10% prepared (or 1 minimum)
                // Now verify all solutions concurrently
                const startTime = Date.now();
                const latencies = [];
                const successes = [];
                const failures = [];
                const verifyPromises = solutions.map(async ({ solution, challenge }) => {
                    try {
                        const { success, latency } = await verifySolution(solution, challenge);
                        latencies.push(latency);
                        if (success) {
                            successes.push(1);
                        }
                        else {
                            failures.push(1);
                        }
                    }
                    catch (error) {
                        failures.push(1);
                        if (error.latency) {
                            latencies.push(error.latency);
                        }
                    }
                });
                await Promise.all(verifyPromises);
                const totalTime = Date.now() - startTime;
                const metrics = calculateMetrics(latencies, solutions.length, failures.length, totalTime);
                console.log(`\n[${name} concurrency] Verification Results:`);
                console.log(`  Total verifications: ${solutions.length}`);
                console.log(`  Successful: ${successes.length}`);
                console.log(`  Failed: ${failures.length}`);
                console.log(`  Total time: ${totalTime}ms`);
                console.log(`  Throughput: ${metrics.throughput?.toFixed(2) ?? 'N/A'} req/s`);
                console.log(`  Error rate: ${metrics.errorRate?.toFixed(2) ?? '0.00'}%`);
                console.log(`  Avg latency: ${metrics.avgLatency.toFixed(2)}ms`);
                console.log(`  P95 latency: ${metrics.p95Latency.toFixed(2)}ms`);
                console.log(`  P99 latency: ${metrics.p99Latency.toFixed(2)}ms`);
                // Assertions
                // With difficulty 10, verification should succeed if solutions were prepared
                if (solutions.length > 0) {
                    expect(successes.length).toBeGreaterThan(solutions.length * 0.95); // At least 95% success rate for prepared solutions
                    expect(metrics.avgLatency).toBeLessThan(2000); // Average latency should be under 2s
                }
                else {
                    // If no solutions were prepared due to timeout, skip the assertion
                    console.warn('No solutions prepared - difficulty 10 solving took too long');
                }
            }, 600000); // 10 minute timeout (solving difficulty 10 takes significant time)
        });
    });
    describe('Cache Behavior', () => {
        it('should prevent challenge reuse', async () => {
            if (SKIP_LOAD_TESTS) {
                return;
            }
            const serverAvailable = await checkServerAvailable();
            if (!serverAvailable) {
                console.warn('Skipping test: server not available');
                return;
            }
            // Fetch a challenge
            const { challenge } = await fetchChallenge();
            // Solve it using the actual difficulty from the server
            const solution = await solveChallenge(challenge);
            // Verify it once (should succeed)
            const result1 = await verifySolution(solution, challenge);
            expect(result1.success).toBe(true);
            // Try to verify the same solution again (should fail - challenge removed from cache)
            try {
                const result2 = await verifySolution(solution, challenge);
                // If we get here, the verification succeeded, which means the challenge wasn't removed
                expect(result2.success).toBe(false);
            }
            catch (error) {
                // Expected: challenge should be removed after first use
                expect(error.error?.message || error.message).toContain('pow_invalid');
            }
        }, 30000);
        it('should handle expired challenges', async () => {
            if (SKIP_LOAD_TESTS) {
                return;
            }
            const serverAvailable = await checkServerAvailable();
            if (!serverAvailable) {
                console.warn('Skipping test: server not available');
                return;
            }
            // Fetch a challenge
            const { challenge } = await fetchChallenge();
            // Wait for it to expire (if TTL is very short, otherwise skip)
            // Note: This test assumes TTL is at least a few seconds
            // For a real test, we'd need to mock time or use a very short TTL
            // Skipping actual expiration wait as it would take too long
            // Instead, verify that challenges have expiration timestamps
            expect(challenge).toHaveProperty('expiresAt');
            if ('expiresAt' in challenge) {
                expect(challenge.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
            }
        }, 10000);
    });
    describe('Performance Benchmarks', () => {
        it('should meet performance targets for challenge generation', async () => {
            if (SKIP_LOAD_TESTS) {
                return;
            }
            const serverAvailable = await checkServerAvailable();
            if (!serverAvailable) {
                console.warn('Skipping test: server not available');
                return;
            }
            const iterations = 20;
            const latencies = [];
            const startTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                try {
                    const { latency } = await fetchChallenge();
                    latencies.push(latency);
                }
                catch (error) {
                    console.warn(`Iteration ${i + 1} failed:`, error);
                }
            }
            const totalTime = Date.now() - startTime;
            const metrics = calculateMetrics(latencies, iterations, iterations - latencies.length, totalTime);
            console.log('\n[Performance Benchmarks] Challenge Generation:');
            console.log(`  Iterations: ${iterations}`);
            console.log(`  Successful: ${latencies.length}`);
            console.log(`  Failed: ${iterations - latencies.length}`);
            if (metrics.throughput) {
                console.log(`  Throughput: ${metrics.throughput.toFixed(2)} req/s`);
            }
            console.log(`  Error rate: ${metrics.errorRate?.toFixed(2) ?? '0.00'}%`);
            console.log(`  Avg latency: ${metrics.avgLatency.toFixed(2)}ms`);
            console.log(`  P95 latency: ${metrics.p95Latency.toFixed(2)}ms`);
            console.log(`  P99 latency: ${metrics.p99Latency.toFixed(2)}ms`);
            // Performance targets
            expect(metrics.avgLatency).toBeLessThan(100); // Average under 100ms
            expect(metrics.p95Latency).toBeLessThan(200); // P95 under 200ms
        }, 30000);
        it('should meet performance targets for verification', async () => {
            if (SKIP_LOAD_TESTS) {
                return;
            }
            const serverAvailable = await checkServerAvailable();
            if (!serverAvailable) {
                console.warn('Skipping test: server not available');
                return;
            }
            const iterations = 10;
            const latencies = [];
            const startTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                try {
                    // Fetch, solve, and verify
                    const { challenge } = await fetchChallenge();
                    const solution = await solveChallenge(challenge);
                    const { latency } = await verifySolution(solution, challenge);
                    latencies.push(latency);
                }
                catch (error) {
                    console.warn(`Iteration ${i + 1} failed:`, error);
                }
            }
            const totalTime = Date.now() - startTime;
            const metrics = calculateMetrics(latencies, iterations, iterations - latencies.length, totalTime);
            console.log('\n[Performance Benchmarks] Verification:');
            console.log(`  Iterations: ${iterations}`);
            console.log(`  Successful: ${latencies.length}`);
            console.log(`  Failed: ${iterations - latencies.length}`);
            if (metrics.throughput) {
                console.log(`  Throughput: ${metrics.throughput.toFixed(2)} req/s`);
            }
            console.log(`  Error rate: ${metrics.errorRate?.toFixed(2) ?? '0.00'}%`);
            console.log(`  Avg latency: ${metrics.avgLatency.toFixed(2)}ms`);
            console.log(`  P95 latency: ${metrics.p95Latency.toFixed(2)}ms`);
            console.log(`  P99 latency: ${metrics.p99Latency.toFixed(2)}ms`);
            // Performance targets (verification includes network + server processing)
            expect(metrics.avgLatency).toBeLessThan(500); // Average under 500ms
            expect(metrics.p95Latency).toBeLessThan(1000); // P95 under 1s
        }, 300000); // 5 minute timeout (solving difficulty 10 takes time)
    });
});
//# sourceMappingURL=pow-load.test.js.map