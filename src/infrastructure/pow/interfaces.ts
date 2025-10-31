/**
 * Proof-of-Work Solver Interface
 */

import { PowChallenge, PowSolution } from '../api/interfaces.js';

/**
 * PoW Solver Interface
 */
export interface IPowSolver {
  /**
   * Solve a proof-of-work challenge
   * 
   * @param challenge PoW challenge from server
   * @returns Promise resolving to solution
   */
  solve(challenge: PowChallenge): Promise<PowSolution>;

  /**
   * Cancel ongoing solve operation
   */
  cancel(): void;
}
