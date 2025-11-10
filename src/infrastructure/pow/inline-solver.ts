/**
 * Inline PoW Solver
 * Solves proof-of-work in the main thread
 * Uses periodic yielding to avoid blocking the UI
 */

import { IPowSolver } from './interfaces.js';
import { PowChallenge, PowSolution } from '../api/interfaces.js';

/**
 * Inline (main thread) PoW solver
 */
export class InlinePowSolver implements IPowSolver {
  private cancelled = false;

  /**
   * Solve PoW challenge
   */
  async solve(challenge: PowChallenge): Promise<PowSolution> {
    this.cancelled = false;
    const target = challenge.difficulty;
    let nonce = 0;

    return new Promise((resolve, reject) => {
      const step = async () => {
        if (this.cancelled) {
          reject(new Error('PoW solving cancelled'));
          return;
        }

        const text = `${challenge.challenge}:${nonce}`;
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

        if (bits >= target) {
          resolve({ challenge: challenge.challenge, nonce });
        } else {
          nonce++;
          // Yield every 1000 iterations to avoid blocking
          if (nonce % 1000 === 0) {
            setTimeout(step, 0);
          } else {
            void step();
          }
        }
      };

      step();
    });
  }

  /**
   * Cancel solving
   */
  cancel(): void {
    this.cancelled = true;
  }
}
