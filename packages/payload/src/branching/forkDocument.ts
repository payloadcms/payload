import type { PayloadRequest } from '../types/index.js'

import { resetBranchState, resolveBranch } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchField,
  branchOpField,
  MAIN_BRANCH,
} from './types.js'

type Args = {
  collectionSlug: string
  id: number | string
  req: PayloadRequest
}

/**
 * Copy-on-write: ensures the active branch has its own row for a document, and
 * returns that row's primary key.
 *
 * Returns the id unchanged on main, or when the branch already has a shadow
 * row. Otherwise it copies the main row wholesale — a full copy rather than a
 * diff, so the branch's version can be filtered and sorted on by the database
 * like any other row.
 */
export const forkDocument = async ({ id, collectionSlug, req }: Args): Promise<number | string> => {
  const branch = resolveBranch(req)

  if (branch === MAIN_BRANCH) {
    return id
  }

  const branching = req.payload.config.branching

  if (!branching?.enabled || !branching.branchableCollections.has(collectionSlug)) {
    return id
  }

  const existing = await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: {
      and: [{ [branchField]: { equals: branch } }, { [branchDocIDField]: { equals: id } }],
    },
  })

  if (existing) {
    return existing.id
  }

  // Already a row on this branch, addressed by its own primary key — a
  // document created on the branch rather than forked from main.
  const self = await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: { and: [{ [branchField]: { equals: branch } }, { id: { equals: id } }] },
  })

  if (self) {
    return id
  }

  const mainDoc = await req.payload.db.findOne({
    branch: false,
    collection: collectionSlug,
    req,
    where: { and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: id } }] },
  })

  if (!mainDoc) {
    return id
  }

  const { id: _discardedID, ...data } = mainDoc as Record<string, unknown>

  const shadow = await req.payload.db.create({
    collection: collectionSlug,
    data: {
      ...data,
      [branchDocIDField]: id,
      [branchField]: branch,
      [branchOpField]: 'update',
    },
    req,
  })

  await req.payload.create({
    collection: branchChangesCollectionSlug,
    data: {
      baseUpdatedAt: (mainDoc as Record<string, unknown>).updatedAt,
      branch,
      collectionSlug,
      doc: { relationTo: collectionSlug, value: id },
      entityType: 'collection',
      operation: 'update',
      rowID: String(shadow.id),
    },
    overrideAccess: true,
    req,
  })

  // The manifest now has one more entry; drop the memoized copy so subsequent
  // reads in this request exclude the newly shadowed main row.
  resetBranchState(req)
  req.branch = branch

  return shadow.id as number | string
}
