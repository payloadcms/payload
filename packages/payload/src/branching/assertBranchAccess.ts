import type { Access } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { Forbidden } from '../errors/index.js'
import { branchesCollectionSlug } from './types.js'

export const assertBranchAccess = async ({
  access,
  branchDoc,
  req,
}: {
  access: Access
  branchDoc: { id: number | string }
  req: PayloadRequest
}): Promise<void> => {
  const accessResult = await executeAccess(
    { id: branchDoc.id, slug: branchesCollectionSlug, req },
    access,
  )

  if (accessResult === true) {
    return
  }

  if (!accessResult) {
    throw new Forbidden(req.t)
  }

  const matchingBranch = await req.payload.db.findOne({
    branch: false,
    collection: branchesCollectionSlug,
    req,
    where: {
      and: [{ id: { equals: branchDoc.id } }, accessResult],
    },
  })

  if (!matchingBranch) {
    throw new Forbidden(req.t)
  }
}
