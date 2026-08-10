import type { Payload, PayloadRequest, Where } from '../types/index.js'
import type { BranchOperation } from './types.js'

import { executeAccess } from '../auth/executeAccess.js'
import { branchDocIDField, branchField, MAIN_BRANCH } from './types.js'

/**
 * What a change will actually do to `main` when merged, which is not always the
 * same as what it did on the branch. Editing a published document on a branch
 * is a `publish` against main, and needs publish permission rather than plain
 * update permission.
 */
export type EffectiveOperation = 'create' | 'delete' | 'publish' | 'update'

export type BlockedChange = {
  changeID: number | string
  collectionSlug: string
  docID: number | string
  docTitle: string
  message: string
  operation: EffectiveOperation
  reason: 'access'
}

type PendingChange = {
  change: Record<string, any>
  collectionSlug: string
  docID: number | string
  operation: EffectiveOperation
  shadow: null | Record<string, unknown>
}

/**
 * Resolves what each change will do to main, reading the shadow row so drafts
 * and publishes can be told apart.
 */
export const resolveEffectiveOperations = async ({
  branch,
  changes,
  payload,
  req,
}: {
  branch: string
  changes: Record<string, any>[]
  payload: Payload
  req: PayloadRequest
}): Promise<PendingChange[]> => {
  const resolved: PendingChange[] = []

  for (const change of changes) {
    const collectionSlug = change.collectionSlug as string
    const docID = change.doc?.value ?? change.doc

    const shadow = (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: {
        and: [
          { [branchField]: { equals: branch } },
          { or: [{ id: { equals: docID } }, { [branchDocIDField]: { equals: docID } }] },
        ],
      },
    })) as null | Record<string, unknown>

    let operation: EffectiveOperation

    if (change.operation === 'delete') {
      operation = 'delete'
    } else if (change.operation === 'create') {
      operation = 'create'
    } else {
      operation = shadow?._status === 'published' ? 'publish' : 'update'
    }

    resolved.push({ change, collectionSlug, docID, operation, shadow })
  }

  return resolved
}

/**
 * Checks the merging user's production permission for every change.
 *
 * A branch is a proposal; nothing on it is real until merge, which is what
 * makes permissive branch writes safe. This is therefore the enforcement
 * boundary, not a second check layered on top of one.
 *
 * Evaluated in two tiers so a large branch does not cost one access call per
 * document: the collection's access function runs once per
 * `(collection, operation)` group, and only a `Where` result falls through to a
 * single query resolving that group per document.
 */
export const runMergePreflight = async ({
  payload,
  pending,
  req,
}: {
  payload: Payload
  pending: PendingChange[]
  req: PayloadRequest
}): Promise<BlockedChange[]> => {
  const blocked: BlockedChange[] = []

  const groups = new Map<string, PendingChange[]>()

  for (const item of pending) {
    const key = `${item.collectionSlug}::${item.operation}`
    const existing = groups.get(key)

    if (existing) {
      existing.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  for (const [key, items] of groups) {
    const [collectionSlug, operation] = key.split('::') as [string, EffectiveOperation]
    const collectionConfig = payload.collections[collectionSlug]?.config

    if (!collectionConfig) {
      continue
    }

    // Publishing is not a distinct access type in Payload — it is `update`
    // evaluated against published data, which is how the admin UI derives
    // whether the publish button is available.
    const accessType = operation === 'publish' ? 'update' : operation
    const accessFn = collectionConfig.access?.[accessType]

    if (!accessFn) {
      continue
    }

    const data = operation === 'publish' ? { _status: 'published' } : undefined

    // Denials are collected and reported per document rather than thrown, so a
    // single unpermitted change does not abort the whole merge.
    const result = await executeAccess({ data, disableErrors: true, req }, accessFn)

    if (result === true) {
      continue
    }

    const deny = (item: PendingChange) =>
      blocked.push({
        changeID: item.change.id,
        collectionSlug,
        docID: item.docID,
        docTitle: String(item.shadow?.[collectionConfig.admin?.useAsTitle ?? 'id'] ?? item.docID),
        message: `You don't have permission to ${operation} "${collectionSlug}" document ${item.docID}.`,
        operation,
        reason: 'access',
      })

    if (result === false || !result) {
      items.forEach(deny)
      continue
    }

    // Tier 2: one query per unresolved group. Anything the access filter does
    // not return is denied.
    const permitted = await payload.db.find({
      branch: false,
      collection: collectionSlug,
      limit: 0,
      pagination: false,
      req,
      where: {
        and: [
          result,
          { [branchField]: { equals: MAIN_BRANCH } },
          { id: { in: items.map((item) => item.docID) } },
        ],
      },
    })

    const permittedIDs = new Set(permitted.docs.map((doc) => String(doc.id)))

    for (const item of items) {
      if (!permittedIDs.has(String(item.docID))) {
        deny(item)
      }
    }
  }

  return blocked
}
