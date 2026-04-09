/**
 * E2E Matrix Generation Utilities
 *
 * This module provides types and functions for generating the GitHub Actions
 * matrix configuration for E2E tests.
 */

export interface TestConfig {
  /** Test file name (relative to tests/e2e/) */
  file: string
  /** Framework adapter to run the suite against */
  framework?: 'next' | 'tanstack-start'
  /** Number of shards to split this test file into */
  shards: number
  /** Whether tests can run in parallel (default: false) */
  parallel?: boolean
  /** Whether to enable cacheComponents for this test run */
  cacheComponents?: boolean
}

interface MatrixEntry {
  suite: string
  framework: 'next' | 'tanstack-start'
  shard: number
  'total-shards': number
  parallel: boolean
  cacheComponents: boolean
}

interface Matrix {
  include: MatrixEntry[]
}

function generateMatrix(testConfigs: TestConfig[]): Matrix {
  const include: MatrixEntry[] = []

  for (const {
    file,
    framework = 'next',
    shards,
    parallel = false,
    cacheComponents = false,
  } of testConfigs) {
    for (let shard = 1; shard <= shards; shard++) {
      include.push({
        suite: file,
        framework,
        shard,
        'total-shards': shards,
        parallel,
        cacheComponents,
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
