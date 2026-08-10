import type { PayloadRequest } from '../types/index.js'

import { resolveBranch } from './resolveBranch.js'
import { branchDocIDField, branchField, MAIN_BRANCH } from './types.js'

type Args = {
  branch?: false | string
  collectionSlug: string
  id: number | string
  req?: Partial<PayloadRequest>
}

/**
 * Translates a canonical document ID into the primary key of the row that the
 * active branch should actually write to.
 *
 * A canonical ID is the only identity the API exposes: on a branch it addresses
 * the branch's own copy, on main it addresses the main row. Reads resolve this
 * through the `where`-tree rewrite; writes cannot, because they address a row
 * by primary key directly — so they resolve it here instead.
 *
 * Returns the ID unchanged on main, when branching is off, or when the branch
 * has no copy of the document.
 */
export const resolveBranchRowID = async ({
  id,
  branch: branchOverride,
  collectionSlug,
  req,
}: Args): Promise<number | string> => {
  if (branchOverride === false || !req?.payload || id === undefined || id === null) {
    return id
  }

  if ((req.context as Record<string, unknown> | undefined)?._branchBypass) {
    return id
  }

  const branching = req.payload.config?.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return id
  }

  const branch = branchOverride ?? resolveBranch(req as PayloadRequest)

  if (branch === MAIN_BRANCH) {
    return id
  }

  const shadow = await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: {
      and: [{ [branchField]: { equals: branch } }, { [branchDocIDField]: { equals: id } }],
    },
  })

  return (shadow?.id as number | string) ?? id
}
