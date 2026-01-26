/**
 * E2E Matrix Generation Utilities
 *
 * This module provides types and functions for generating the GitHub Actions
 * matrix configuration for E2E tests.
 */

export interface TestConfig {
  /** Test file name (relative to tests/e2e/) */
  file: string
  /** Number of shards to split this test file into */
  shards: number
}

interface MatrixEntry {
  'test-file': string
  shard: number
  'total-shards': number
}

interface Matrix {
  include: MatrixEntry[]
}

function generateMatrix(testConfigs: TestConfig[]): Matrix {
  const include: MatrixEntry[] = []

  for (const { file, shards } of testConfigs) {
    for (let shard = 1; shard <= shards; shard++) {
      include.push({
        'test-file': file,
        shard,
        'total-shards': shards,
      })
    }
  }

  return { include }
}

/**
 * Creates and outputs the E2E test matrix configuration for GitHub Actions.
 * Prints the matrix JSON to stdout for consumption by the CI workflow.
 *
 * @param testConfigs - Array of test files and their shard counts
 */
export function createE2EConfig(testConfigs: TestConfig[]): void {
  const matrix = generateMatrix(testConfigs)
  console.log(JSON.stringify(matrix))
}
