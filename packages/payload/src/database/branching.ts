import type { JsonObject, PayloadRequest, Where } from '../types/index.js'
import type { TypeWithVersion } from '../versions/types.js'
import type { Count, CountArgs, Find, FindArgs, FindDistinct, FindDistinctArgs } from './types.js'

/** Trusted native query context over private, rebuildable effective-content indexes. */
export type BranchProjectionQueryContext = {
  /** Encoded query-index branch key, distinct from any public branch name or cache ID. */
  branchKey: string
  /** Optional bounded graph batch targeting; predicates and access remain authoritative. */
  graphTarget?: { collection: string; ids: readonly string[] }
  /** Compiled separately for each original join target; access policies are already in relationAccess. */
  joins?: Record<
    string,
    Record<string, { count?: boolean; limit?: number; page?: number; sort: string[]; where: Where }>
  >
  /** Original entity read predicates translated to each private relation; missing means denied. */
  relationAccess: Record<string, false | Where>
}

export type BranchProjectionQueries = {
  count: (args: { context: BranchProjectionQueryContext } & CountArgs) => ReturnType<Count>
  find: (args: { context: BranchProjectionQueryContext } & FindArgs) => ReturnType<Find>
  findDistinct: (
    args: { context: BranchProjectionQueryContext } & FindDistinctArgs,
  ) => ReturnType<FindDistinct>
  /** Optional fixed-snapshot batching of registered private readiness coordinates, never content IDs. */
  readStates?: (args: {
    reads: {
      branchKey: string
      collection: string
      scopes: { rowKey: string; scopeKey: string }[]
    }[]
    req: PayloadRequest
  }) => Promise<Record<string, unknown>[]>
}

export type BranchStorageEntity =
  | { parentID: number | string; slug: string; type: 'collection' }
  | { slug: string; type: 'global' }

/** Adapter-owned boundary; interactive mutations must reject missing or expired caller transactions. */
export type BranchingAdapter = {
  capabilities: (args: { req?: Partial<PayloadRequest> }) => Promise<{
    atomicBatch: boolean
    interactiveTransactions: boolean
    reason?: string
  }>
  /**
   * Trusted adapter boundary for compiled branch operations, never user-supplied SQL.
   * Expected row counts must be asserted inside the atomic batch before it commits.
   * This cannot join an interactive caller transaction. Authorization, freezing,
   * publication validation and SQL compilation belong to the calling branch engine.
   */
  executeAtomicBatch?: (args: {
    req?: Partial<PayloadRequest>
    statements: {
      expectedChanges?: number
      params?: (ArrayBuffer | null | number | string)[]
      sql: string
    }[]
  }) => Promise<{ changes: number; rows: Record<string, unknown>[] }[]>
  mutateVersion: (args: {
    entity: BranchStorageEntity
    expected: { generation: number; id: number | string }
    mutation:
      | { data: JsonObject; ownerKey: string; type: 'replace' }
      | { isFrozen: boolean; ownerKey: string; type: 'initialize' }
      | { type: 'freeze' }
    req: PayloadRequest
  }) => Promise<null | TypeWithVersion<JsonObject>>
  /** Every predicate, relationship hop, join and distinct path uses this same effective relation. */
  queryProjection?: BranchProjectionQueries
  /** Private derived-index replacement. Native document stores must remove omitted fields before predicates run. */
  replaceProjection?: (args: {
    collection: string
    replacement: Record<string, unknown>
    req: PayloadRequest
  }) => Promise<void>
  /**
   * Collect raw query results and population before document hooks run. The callback
   * runs exactly once and must use the supplied request for every database read.
   * Its returned raw graph is usable only after this boundary resolves. Adapters
   * either hold a native snapshot or validate every recorded read atomically.
   */
  withReadSnapshot?: <T>(args: {
    read: (args: { req: PayloadRequest }) => Promise<T>
    req: PayloadRequest
  }) => Promise<T>
}
