import type { EffectiveOperation } from './effectiveOperations.js'

export type BlockedChange = {
  changeID: number | string
  /** Absent for a global. */
  collectionSlug?: string
  /** Absent for a global. */
  docID?: number | string
  docTitle: string
  globalSlug?: string
  message: string
  operation: EffectiveOperation
  reason: 'access' | 'dependency'
}
