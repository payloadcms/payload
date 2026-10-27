import type { PayloadRequest } from '../types/index.js'

import type { EffectiveOperation } from './effectiveOperations.js'

export type BranchMergeValidationCandidate = {
  changeID: number | string
  collectionSlug?: string
  data?: Record<string, unknown>
  docID?: number | string
  draft: boolean
  entityType: 'collection' | 'global'
  globalSlug?: string
  locale?: string
  operation: EffectiveOperation
}

export type BranchMergeValidationError = {
  changeID: number | string
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
  locale?: string
  message: string
  path?: string
}

export type BranchMergeValidationResult = {
  errors: BranchMergeValidationError[]
  valid: boolean
}

export type BranchMergeValidate = (args: {
  branch: string
  candidates: BranchMergeValidationCandidate[]
  req: PayloadRequest
  target: 'main'
}) => BranchMergeValidationResult | Promise<BranchMergeValidationResult>
