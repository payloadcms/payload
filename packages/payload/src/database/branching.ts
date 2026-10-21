import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { TypeWithVersion } from '../versions/types.js'

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
}
