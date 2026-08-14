import type { Payload, PayloadRequest } from '../types/index.js'
import type { EffectiveOperation, ResolvedChange } from './effectiveOperations.js'

import { executeAccess } from '../auth/executeAccess.js'
import { operationsForChange } from './effectiveOperations.js'
import { branchField, MAIN_BRANCH } from './types.js'

export type { EffectiveOperation }

export type BlockedChange = {
  changeID: number | string
  /** Absent for a global. */
  collectionSlug?: string
  /** Absent for a global. */
  docID?: number | string
  docTitle: string
  globalSlug?: string
  message: string
  operation: EffectiveOperation
  reason: 'access'
}

/** One `(collection, operation)` pair to check, and the change that needs it. */
type PendingOperation = {
  collectionSlug: string
  operation: EffectiveOperation
  resolved: ResolvedChange
}

/**
 * Flattens resolved changes into the operations each one performs.
 *
 * A change can require two permissions — a branch holding a published state and
 * a newer draft publishes *and* updates — and §7 blocks such a change as a whole
 * rather than letting a user who can update but not publish get the draft half.
 */
const toPendingOperations = (pending: ResolvedChange[]): PendingOperation[] =>
  pending.flatMap((resolved) =>
    operationsForChange(resolved).map((operation) => ({
      collectionSlug: resolved.collectionSlug,
      operation,
      resolved,
    })),
  )

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
  pending: ResolvedChange[]
  req: PayloadRequest
}): Promise<BlockedChange[]> => {
  const blocked: BlockedChange[] = []

  const groups = new Map<string, PendingOperation[]>()

  for (const item of toPendingOperations(pending)) {
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

    const deny = ({ resolved }: PendingOperation) =>
      blocked.push({
        changeID: resolved.change.id,
        collectionSlug,
        docID: resolved.docID,
        docTitle: String(
          resolved.shadow?.[collectionConfig.admin?.useAsTitle ?? 'id'] ?? resolved.docID,
        ),
        message: `You don't have permission to ${operation} "${collectionSlug}" document ${resolved.docID}.`,
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
          { id: { in: items.map((item) => item.resolved.docID) } },
        ],
      },
    })

    const permittedIDs = new Set(permitted.docs.map((doc) => String(doc.id)))

    for (const item of items) {
      if (!permittedIDs.has(String(item.resolved.docID))) {
        deny(item)
      }
    }
  }

  return blocked
}

/**
 * The same enforcement boundary for globals.
 *
 * Simpler than the collection preflight by the nature of the thing: there is one document
 * per global, so there are no groups to form and no second-tier query to run — the
 * global's own `update` access function, evaluated once as the merging user.
 *
 * A `Where`-returning access function is treated as permitting the merge. On a collection
 * a `Where` narrows *which* documents may be written, which is exactly what tier 2
 * resolves with a query; on a global there is nothing for it to narrow, and refusing on
 * that basis would block a merge that the same user could perform by hand on main.
 */
export const runGlobalMergePreflight = async ({
  payload,
  pending,
  req,
}: {
  payload: Payload
  pending: Record<string, any>[]
  req: PayloadRequest
}): Promise<BlockedChange[]> => {
  const blocked: BlockedChange[] = []

  for (const change of pending) {
    const globalSlug = change.globalSlug as string
    const globalConfig = payload.globals?.config?.find((each) => each.slug === globalSlug)

    if (!globalConfig) {
      continue
    }

    const access = globalConfig.access?.update

    if (!access) {
      continue
    }

    const result = await access({ data: undefined, req })

    if (result === false) {
      const label = typeof globalConfig.label === 'string' ? globalConfig.label : globalConfig.slug

      blocked.push({
        changeID: change.id as number | string,
        docTitle: label,
        globalSlug,
        message: `You do not have permission to update ${label}.`,
        operation: 'update',
        reason: 'access',
      })
    }
  }

  return blocked
}
