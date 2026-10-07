import type { PayloadRequest } from '../types/index.js'

import { assertBranchAccess } from './assertBranchAccess.js'
import { branchesCollectionSlug } from './types.js'

export const assertBranchUpdateAccess = async ({
  branchDoc,
  req,
}: {
  branchDoc: { id: number | string }
  req: PayloadRequest
}): Promise<void> => {
  const branchesCollection = req.payload.collections[branchesCollectionSlug]!.config

  await assertBranchAccess({ access: branchesCollection.access.update, branchDoc, req })
}
