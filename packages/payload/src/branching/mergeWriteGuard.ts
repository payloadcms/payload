import type { PayloadRequest } from '../types/index.js'

import { resolveBranch } from './resolveBranch.js'
import { MAIN_BRANCH } from './types.js'

export type BranchMergeWrite = {
  collectionSlug?: string
  data: Record<string, unknown>
  globalSlug?: string
  req: PayloadRequest
}

export type BranchMergeWriteGuard = (write: BranchMergeWrite) => Promise<void>

export const branchMergeWriteGuardContextKey = Symbol('branchMergeWriteGuard')

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
