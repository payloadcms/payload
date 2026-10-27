import type { PayloadRequest } from '../types/index.js'
import type { EffectiveOperation } from './effectiveOperations.js'

import { ValidationError } from '../errors/ValidationError.js'

import {
  validateCollectionData,
  validateGlobalData,
} from '../utilities/entityInputSchema/validateEntityData.js'

import { isolateBranchState } from './resolveBranch.js'

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

/** Best-effort structural validation for the exact candidates selected by merge. */
export const defaultBranchMergeValidation: BranchMergeValidate = ({ candidates, req }) => {
  const errors: BranchMergeValidationError[] = []

  for (const candidate of candidates) {
    if (!candidate.data || candidate.operation === 'delete') {
      continue
    }

    const candidateReq = isolateBranchState(req)

    if (candidate.locale) {
      candidateReq.locale = candidate.locale
    }

    try {
      if (candidate.entityType === 'collection' && candidate.collectionSlug) {
        validateCollectionData({
          slug: candidate.collectionSlug as never,
          data: candidate.data,
          partial: candidate.operation !== 'create',
          req: candidateReq,
        })
      } else if (candidate.entityType === 'global' && candidate.globalSlug) {
        validateGlobalData({
          slug: candidate.globalSlug as never,
          data: candidate.data,
          req: candidateReq,
        })
      }
    } catch (error) {
      if (!(error instanceof ValidationError)) {
        throw error
      }

      for (const fieldError of error.data.errors) {
        errors.push({
          changeID: candidate.changeID,
          collectionSlug: candidate.collectionSlug,
          docID: candidate.docID,
          globalSlug: candidate.globalSlug,
          locale: candidate.locale,
          message: fieldError.message,
          path: fieldError.path,
        })
      }
    }
  }

  return { errors, valid: errors.length === 0 }
}
