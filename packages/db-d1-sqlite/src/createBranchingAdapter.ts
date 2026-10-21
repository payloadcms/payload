import type { BranchingAdapter } from 'payload'

import type { SQLiteD1Adapter } from './types.js'

import { createReadSnapshot } from './createReadSnapshot.js'

const assertionMarker = 'payload_branch_atomic_conflict'
const assertionSQL = `SELECT CASE WHEN changes() = ? THEN 1 ELSE json_extract('{}', '${assertionMarker}') END`
const conflictMessages = new Set([
  `D1_ERROR: bad JSON path: '${assertionMarker}': SQLITE_ERROR`,
  `D1_ERROR: JSON path error near '${assertionMarker}': SQLITE_ERROR`,
])

/** D1 has atomic batches, but cannot execute Payload's interactive transaction protocol. */
export const createD1BranchingAdapter = ({
  adapter,
  interactiveAdapter,
}: {
  adapter: SQLiteD1Adapter
  interactiveAdapter: BranchingAdapter
}): BranchingAdapter => ({
  ...interactiveAdapter,
  capabilities: () =>
    Promise.resolve({
      atomicBatch: hasAtomicBatch({ adapter }),
      interactiveTransactions: false,
      reason: 'D1 does not support interactive caller transactions.',
    }),
  executeAtomicBatch: async ({ req, statements }) => {
    if ((await req?.transactionID) != null) {
      throw new Error('D1 branch atomic batches cannot join an interactive caller transaction.')
    }

    if (!hasAtomicBatch({ adapter })) {
      throw new Error('D1 branch atomic batches require a D1 binding with batch support.')
    }

    validateStatements({ statements })

    try {
      const binding = getBinding({ adapter })
      const nativeStatements = []
      const resultIndexes: number[] = []

      // All preparation completes before invoking batch; no statement is executed separately.
      for (const { expectedChanges, params = [], sql } of statements) {
        resultIndexes.push(nativeStatements.length)
        nativeStatements.push(binding.prepare(sql).bind(...params))

        if (expectedChanges !== undefined) {
          // CASE is lazy. A failed assertion raises inside the same batch, rolling back
          // all earlier writes. A post-commit inspection of meta.changes cannot do this.
          nativeStatements.push(binding.prepare(assertionSQL).bind(expectedChanges))
        }
      }

      const results = await binding.batch<Record<string, unknown>>(nativeStatements)

      return results
        .filter((_, index) => resultIndexes.includes(index))
        .map(({ meta, results }) => ({ changes: meta.changes, rows: results ?? [] }))
    } catch (error) {
      // Avoid leaking native SQL, bound values or driver causes across this boundary.
      if (error instanceof Error && conflictMessages.has(error.message)) {
        throw new Error('D1 branch atomic batch conflict.')
      }

      throw new Error('D1 branch atomic batch failed.')
    }
  },
  withReadSnapshot: createReadSnapshot({ adapter }),
})

const hasAtomicBatch = ({ adapter }: { adapter: SQLiteD1Adapter }): boolean =>
  typeof getBinding({ adapter })?.batch === 'function' &&
  typeof getBinding({ adapter })?.prepare === 'function'

// Reuse the connected session when read replicas are enabled so its consistency
// bookmark includes this batch. Before connect, the configured binding is usable.
const getBinding = ({ adapter }: { adapter: SQLiteD1Adapter }): SQLiteD1Adapter['binding'] =>
  adapter.client ?? adapter.binding

const validateStatements = ({
  statements,
}: Parameters<NonNullable<BranchingAdapter['executeAtomicBatch']>>[0]): void => {
  if (!Array.isArray(statements) || statements.length === 0 || statements.length > 100) {
    throw new Error('D1 branch atomic batches require between 1 and 100 statements.')
  }

  let nativeStatementCount = 0
  let parameterCount = 0
  let byteCount = 0
  const encoder = new TextEncoder()

  for (const statement of statements) {
    if (!statement || typeof statement.sql !== 'string') {
      throw new Error('Invalid D1 branch atomic batch statement.')
    }

    const { expectedChanges, params = [], sql } = statement
    const operation = sql.trimStart().match(/^(SELECT|INSERT|UPDATE|DELETE|REPLACE)\b/i)?.[1]

    // The trusted compiler emits one direct statement per entry. Excluding separators,
    // transaction control and schema operations keeps the batch boundary unambiguous.
    if (!operation || sql.includes(';') || encoder.encode(sql).byteLength > 100_000) {
      throw new Error('Invalid D1 branch atomic batch SQL.')
    }

    if (
      expectedChanges !== undefined &&
      (!Number.isSafeInteger(expectedChanges) ||
        expectedChanges < 0 ||
        operation.toUpperCase() === 'SELECT')
    ) {
      throw new Error('Invalid D1 branch atomic batch expected row count.')
    }

    if (!Array.isArray(params) || params.length > 100) {
      throw new Error('Invalid D1 branch atomic batch parameters.')
    }

    byteCount += encoder.encode(sql).byteLength
    nativeStatementCount += expectedChanges === undefined ? 1 : 2
    parameterCount += params.length + (expectedChanges === undefined ? 0 : 1)

    for (const param of params) {
      if (typeof param === 'string') {
        byteCount += encoder.encode(param).byteLength
      } else if (param instanceof ArrayBuffer) {
        byteCount += param.byteLength
      } else if (param !== null && (typeof param !== 'number' || !Number.isFinite(param))) {
        throw new Error('Invalid D1 branch atomic batch parameter value.')
      }
    }
  }

  if (nativeStatementCount > 100 || parameterCount > 1_000 || byteCount > 1_000_000) {
    throw new Error('D1 branch atomic batch exceeds its statement, parameter or byte limit.')
  }
}
