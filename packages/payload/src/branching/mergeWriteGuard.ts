import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'
import { resolveBranch } from './resolveBranch.js'
import { MAIN_BRANCH } from './types.js'

export type BranchMergeWrite = {
  collectionSlug?: string
  data: Record<string, unknown>
  globalSlug?: string
  req: PayloadRequest
}

export type BranchMergeWriteGuard = (write: BranchMergeWrite) => Promise<void>

export const branchMergeValidationContextKey = Symbol('branchMergeValidation')
export const branchMergeWriteGuardContextKey = Symbol('branchMergeWriteGuard')

/** Prevents content writes made through a branch merge validation request. */
export const assertBranchMergeValidationWriteAllowed = ({
  req,
}: {
  req?: Partial<PayloadRequest>
}): void => {
  if (isBranchMergeValidationRequest({ req })) {
    throw new APIError('Content cannot be changed during branch merge validation.', 409)
  }
}

export const isBranchMergeValidationRequest = ({
  req,
}: {
  req?: Partial<PayloadRequest>
}): boolean =>
  Boolean(
    (req?.context as Record<PropertyKey, unknown> | undefined)?.[branchMergeValidationContextKey],
  )

/** Runs the active merge's final-data guard after hooks and field processing. */
export const runBranchMergeWriteGuard = async ({
  collectionSlug,
  data,
  globalSlug,
  req,
}: BranchMergeWrite): Promise<void> => {
  if (resolveBranch(req) !== MAIN_BRANCH) {
    return
  }

  const guard = (req.context as Record<PropertyKey, unknown> | undefined)?.[
    branchMergeWriteGuardContextKey
  ] as BranchMergeWriteGuard | undefined

  await guard?.({ collectionSlug, data, globalSlug, req })
}
