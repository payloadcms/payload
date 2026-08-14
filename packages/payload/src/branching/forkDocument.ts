import { v4 as uuid } from 'uuid'

import type { PayloadRequest } from '../types/index.js'

import {
  addToBranchManifest,
  peekBranchRowID,
  rememberBranchRowID,
  resolveBranch,
} from './resolveBranch.js'
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

  const remembered = peekBranchRowID({ collectionSlug, docID: id, req })

  if (remembered !== undefined) {
    return remembered
  }

  // One query for all three questions this used to ask separately: does the branch
  // already have a copy (by canonical ID), is this row the branch's own creation (by its
  // primary key), and failing both, what does main hold? A branch row wins when both come
  // back — the same pick `pickBranchGlobal` makes for globals.
  const { docs } = await req.payload.db.find({
    branch: false,
    collection: collectionSlug,
    limit: 2,
    pagination: false,
    req,
    where: {
      and: [
        { [branchField]: { in: [branch, MAIN_BRANCH] } },
        { or: [{ id: { equals: id } }, { [branchDocIDField]: { equals: id } }] },
      ],
    },
  })

  const rows = docs as Record<string, unknown>[]
  const onBranch = rows.find((row) => row[branchField] === branch)

  if (onBranch) {
    const rowID = onBranch.id as number | string

    rememberBranchRowID({ collectionSlug, docID: id, req, rowID })

    return rowID
  }

  const mainDoc = rows.find((row) => row[branchField] === MAIN_BRANCH)

  if (!mainDoc) {
    return id
  }

  const { id: _discardedID, ...data } = mainDoc

  // Array and block rows are rows of their own under a relational adapter, with primary
  // keys of their own, so copying them verbatim makes the insert collide with the
  // originals — `UNIQUE constraint failed`, and the fork fails outright rather than
  // degrading. Mongo stores them as subdocuments and does not care, which is why no
  // flat-field test ever saw this.
  const copied = stripRowIDs(data)

  const shadow = await req.payload.db.create({
    collection: collectionSlug,
    data: {
      ...copied,
      [branchDocIDField]: id,
      [branchField]: branch,
      [branchOpField]: 'update',
    },
    req,
  })

  await req.payload.create({
    collection: branchChangesCollectionSlug,
    data: {
      baseUpdatedAt: mainDoc.updatedAt,
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

  // The manifest now has one more entry. Added rather than reloaded: dropping the memoized
  // copy made the next read in this request re-query every change row on the branch to
  // learn one ID, and every save the admin panel makes is a write followed by a read.
  addToBranchManifest({ collectionSlug, docID: id, req })
  rememberBranchRowID({ collectionSlug, docID: id, req, rowID: shadow.id as number | string })

  return shadow.id as number | string
}

/**
 * Re-keys the nested rows of a copied document.
 *
 * Array and block rows own primary keys of their own under a relational adapter, so a
 * verbatim copy collides with the originals. New keys rather than none: this writes through
 * `db.create` to keep the copy byte-identical, which skips the field hooks that would
 * otherwise mint them, and the columns are `NOT NULL`.
 *
 * Applied to a raw database row rather than an API document, which is what makes the
 * blanket walk safe: at this level the only arrays of objects are array and block rows,
 * the ones that own an `id`. Relationships are IDs or `{ relationTo, value }` pairs, and a
 * localized array arrives as `{ en: [...], es: [...] }` — hence recursing through plain
 * objects too.
 */
const stripRowIDs = (value: unknown): any => {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (entry && typeof entry === 'object' && 'id' in (entry as Record<string, unknown>)) {
        const row = entry as Record<string, unknown>

        return stripRowIDs({
          ...row,
          // Numeric keys come from a sequence the database owns, so they are left for it
          // to assign.
          id: typeof row.id === 'string' ? uuid() : undefined,
        })
      }

      return stripRowIDs(entry)
    })
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, each]) => [
        key,
        stripRowIDs(each),
      ]),
    )
  }

  return value
}
