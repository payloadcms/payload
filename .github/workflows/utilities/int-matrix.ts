/**
 * Integration Test Matrix Generation Utilities
 *
 * This module provides types and functions for generating the GitHub Actions
 * matrix configuration for integration tests.
 */

export interface IntTestConfig {
  /** List of database adapters to test against */
  databases: string[]
  /** Number of shards to split each database test into */
  shards: number
}

interface MatrixEntry {
  database: string
  shard: number
  'total-shards': number
}

interface Matrix {
  include: MatrixEntry[]
}

function generateMatrix(config: IntTestConfig): Matrix {
  const include: MatrixEntry[] = []

  for (const database of config.databases) {
    for (let shard = 1; shard <= config.shards; shard++) {
      include.push({
        database,
        shard,
        'total-shards': config.shards,
      })
    }
  }

  return { include }
}

/**
 * Creates and outputs the integration test matrix configuration for GitHub Actions.
 * Prints the matrix JSON to stdout for consumption by the CI workflow.
 *
 * @param config - Database list and shard count
 */
export function createIntConfig(config: IntTestConfig): void {
  const matrix = generateMatrix(config)
  console.log(JSON.stringify(matrix))
}
