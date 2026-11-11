import type { BranchOperation } from 'payload'

import './index.css'

/** The least a change has to say about itself to be counted here. */
export type SummarizableChange = {
  /** Absent for a global. */
  collectionSlug?: string
  globalSlug?: string
  operation?: BranchOperation
}
