import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'
import type { Payload } from '../index.js'
import type { JsonObject, PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

type Operation = 'read' | 'update'

const normalizeDocumentTarget = (
  document: unknown,
  payload?: Payload,
): null | { rawValue: number | string; relationTo: string; targetId: number | string } => {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return null
  }

  const { relationTo, value } = document as { relationTo?: unknown; value?: unknown }
  if (typeof relationTo !== 'string' || relationTo.length === 0) {
    return null
  }

  const candidateId =
    typeof value === 'object' && value !== null && !Array.isArray(value) && 'id' in value
      ? (value as { id?: unknown }).id
      : value

  if (
    !(
      (typeof candidateId === 'string' && candidateId.length > 0) ||
      (typeof candidateId === 'number' && Number.isFinite(candidateId))
    )
  ) {
    return null
  }

  let targetId: number | string = candidateId
  const relatedFields = payload?.collections?.[relationTo]?.config?.fields
  if (typeof candidateId === 'string' && Array.isArray(relatedFields)) {
    const idField = relatedFields.find(
      (field) => Boolean(field && typeof field === 'object' && 'name' in field && field.name === 'id'),
    )
    if (idField && 'type' in idField && idField.type === 'number') {
      const parsed = parseFloat(candidateId)
      if (!Number.isFinite(parsed)) {
        return null
      }
      targetId = parsed
    }
  }

  const rawValue: number | string =
    typeof value === 'string' || typeof value === 'number' ? value : targetId

  return { rawValue, relationTo, targetId }
}

/**
 * Lock rows are only as visible/editable as the document or global they point at.
 * Returns the existing lock rows whose target the user may `operation`, or `null` when
 * unauthenticated.
 */
const getAccessibleLocks = async (
  req: PayloadRequest,
  operation: Operation,
  id?: number | string,
): Promise<(JsonObject & TypeWithID)[] | null> => {
  if (!req.user) {
    return null
  }

  const { payload } = req

  const locks = await payload.db.find<JsonObject & TypeWithID>({
    collection: lockedDocumentsCollectionSlug,
    limit: 0,
    pagination: false,
    req,
    ...(id !== undefined ? { where: { id: { equals: id } } } : {}),
  })

  const validLocks: (JsonObject & TypeWithID)[] = []
  const idsByCollection = new Map<string, Set<number | string>>()
  const globalSlugs = new Set<string>()

  for (const lock of locks.docs) {
    const hasGlobal = Boolean(lock.globalSlug)
    const hasDoc = lock.document !== undefined && lock.document !== null

    if (hasGlobal && hasDoc) {
      continue
    }

    if (hasGlobal) {
      if (typeof lock.globalSlug === 'string') {
        validLocks.push(lock)
        globalSlugs.add(lock.globalSlug)
      }
    } else {
      const normalized = normalizeDocumentTarget(lock.document, payload)
      if (normalized) {
        validLocks.push(lock)
        let ids = idsByCollection.get(normalized.relationTo)
        if (!ids) {
          ids = new Set()
          idsByCollection.set(normalized.relationTo, ids)
        }
        ids.add(normalized.targetId)
      }
    }
  }

  const allowedTargetIdsByCollection = new Map<string, Set<string>>()

  for (const [slug, ids] of idsByCollection.entries()) {
    const config = payload.collections[slug]?.config

    if (!config) {
      continue
    }

    const allowedIds = new Set<string>()
    const whereClauses: Where[] = []

    for (const targetId of ids) {
      const result = await executeAccess(
        { id: targetId, disableErrors: true, req, slug },
        config.access[operation] as Access,
      )

      if (result === true) {
        allowedIds.add(String(targetId))
      } else if (result) {
        whereClauses.push({
          and: [{ id: { equals: targetId } }, result],
        })
      }
    }

    if (whereClauses.length > 0) {
      const matches = await payload.db.find<TypeWithID>({
        collection: slug,
        limit: 0,
        pagination: false,
        req,
        select: { id: true },
        where: whereClauses.length === 1 ? whereClauses[0] : { or: whereClauses },
      })

      for (const doc of matches.docs) {
        allowedIds.add(String(doc.id))
      }
    }

    if (allowedIds.size > 0) {
      allowedTargetIdsByCollection.set(slug, allowedIds)
    }
  }

  const allowedGlobals = new Set<string>()

  for (const slug of globalSlugs) {
    const globalConfig = payload.config.globals.find((global) => global.slug === slug)

    if (!globalConfig) {
      continue
    }

    const result = await executeAccess(
      { disableErrors: true, req, slug },
      globalConfig.access?.[operation] as Access,
    )

    if (result === true) {
      allowedGlobals.add(slug)
    } else if (result) {
      const globalDoc = await payload.db.findGlobal({
        slug,
        req,
        where: result,
      })

      if (globalDoc && Object.keys(globalDoc).length > 0) {
        allowedGlobals.add(slug)
      }
    }
  }

  return validLocks.filter((lock) => {
    if (lock.globalSlug) {
      return typeof lock.globalSlug === 'string' && allowedGlobals.has(lock.globalSlug)
    }
    const normalized = normalizeDocumentTarget(lock.document, payload)
    if (normalized) {
      return Boolean(
        allowedTargetIdsByCollection.get(normalized.relationTo)?.has(String(normalized.targetId)),
      )
    }
    return false
  })
}

/**
 * Converts accessible lock rows into a `Where` binding each lock ID to its authorized target
 * (`{ id: { exists: false } }` when authenticated with zero accessible locks so list queries
 * return an empty result set rather than 403, and `false` when unauthenticated).
 */
const locksToWhere = (
  locks: (JsonObject & TypeWithID)[] | null,
  payload?: Payload,
): boolean | Where => {
  if (!locks) {
    return false
  }

  const clauses: Where[] = []
  for (const lock of locks) {
    if (typeof lock.globalSlug === 'string' && lock.globalSlug.length > 0) {
      clauses.push({
        and: [
          { id: { equals: lock.id } },
          { globalSlug: { equals: lock.globalSlug } },
          { document: { exists: false } },
        ],
      })
      continue
    }

    const normalized = normalizeDocumentTarget(lock.document, payload)
    if (normalized) {
      clauses.push({
        and: [
          { id: { equals: lock.id } },
          { 'document.relationTo': { equals: normalized.relationTo } },
          { 'document.value': { equals: normalized.rawValue } },
          {
            or: [{ globalSlug: { exists: false } }, { globalSlug: { equals: '' } }],
          },
        ],
      })
    }
  }

  if (!clauses.length) {
    return { id: { exists: false } }
  }

  return clauses.length === 1 ? clauses[0]! : { or: clauses }
}

const getAccessibleLocksWhere = async (
  req: PayloadRequest,
  operation: Operation,
  id?: number | string,
): Promise<boolean | Where> => locksToWhere(await getAccessibleLocks(req, operation, id), req.payload)

/**
 * Locking a document or global needs the same access as editing it.
 * Without a single target there is nothing to authorize, and dual-target rows are rejected.
 */
const canCreateLock: Access = async ({ data, req }) => {
  if (!req.user || !data) {
    return false
  }

  const { payload } = req
  const { document, globalSlug } = data as {
    document?: unknown
    globalSlug?: unknown
  }

  const hasGlobal = Boolean(globalSlug)
  const hasDoc = document !== undefined && document !== null

  if (hasGlobal && hasDoc) {
    return false
  }

  if (hasGlobal) {
    if (typeof globalSlug !== 'string') {
      return false
    }

    const globalConfig = payload.config.globals.find((global) => global.slug === globalSlug)

    if (!globalConfig) {
      return false
    }

    const result = await executeAccess(
      { disableErrors: true, req, slug: globalSlug },
      globalConfig.access?.update as Access,
    )

    if (!result || result === true) {
      return Boolean(result)
    }

    const globalDoc = await payload.db.findGlobal({
      slug: globalSlug,
      req,
      where: result,
    })

    return Boolean(globalDoc && Object.keys(globalDoc).length > 0)
  }

  const normalized = normalizeDocumentTarget(document, payload)
  if (!normalized) {
    return false
  }

  const config = payload.collections[normalized.relationTo]?.config

  if (!config) {
    return false
  }

  const result = await executeAccess(
    { id: normalized.targetId, disableErrors: true, req, slug: normalized.relationTo },
    config.access.update as Access,
  )

  if (!result || result === true) {
    return Boolean(result)
  }

  const { totalDocs } = await payload.db.count({
    collection: normalized.relationTo,
    req,
    where: { and: [{ id: { equals: normalized.targetId } }, result] },
  })

  return totalDocs > 0
}

/**
 * Updating a lock must authorize both the existing target and any modified destination
 * `document` or `globalSlug`, while keeping each row bound to a single valid target.
 */
const canUpdateLock: Access = async ({ id, data, req }) => {
  if (!req.user) {
    return false
  }

  const hasData = Boolean(data && typeof data === 'object')
  const typedData = data as
    | {
        document?: { relationTo?: string; value?: number | string } | null
        globalSlug?: string | null
      }
    | undefined
  const modifiesDocument = hasData && typedData?.document !== undefined
  const modifiesGlobal = hasData && typedData?.globalSlug !== undefined

  if (!modifiesDocument && !modifiesGlobal) {
    return getAccessibleLocksWhere(req, 'update', id)
  }

  if (modifiesDocument && modifiesGlobal) {
    const allowed = await canCreateLock({ data, req })
    if (!allowed) {
      return false
    }
    return getAccessibleLocksWhere(req, 'update', id)
  }

  if (modifiesDocument && typedData?.document !== null) {
    const allowed = await canCreateLock({ data: { document: typedData?.document }, req })
    if (!allowed) {
      return false
    }
  }

  if (modifiesGlobal && Boolean(typedData?.globalSlug)) {
    const allowed = await canCreateLock({ data: { globalSlug: typedData?.globalSlug }, req })
    if (!allowed) {
      return false
    }
  }

  const accessibleLocks = await getAccessibleLocks(req, 'update', id)
  if (!accessibleLocks) {
    return false
  }

  const compatibleLocks = accessibleLocks.filter((lock) => {
    const nextDocument = modifiesDocument ? typedData?.document : lock.document
    const nextGlobal = modifiesGlobal ? typedData?.globalSlug : lock.globalSlug
    const hasNextGlobal = Boolean(nextGlobal)
    const hasNextDoc = nextDocument !== undefined && nextDocument !== null

    if (hasNextGlobal && hasNextDoc) {
      return false
    }
    if (hasNextGlobal && typeof nextGlobal !== 'string') {
      return false
    }
    if (!hasNextGlobal && !normalizeDocumentTarget(nextDocument, req.payload)) {
      return false
    }
    return true
  })

  if (accessibleLocks.length > 0 && !compatibleLocks.length) {
    return false
  }

  return locksToWhere(compatibleLocks, req.payload)
}

export const getLockedDocumentsCollection = (config: Config): CollectionConfig | null => {
  const lockableCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.lockDocuments !== false)
    .map((collectionConfig) => collectionConfig.slug)

  const lockableGlobals = config.globals
    ? config.globals.filter((globalConfig) => globalConfig.lockDocuments !== false)
    : []

  const authCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.auth)
    .map((collectionConfig) => collectionConfig.slug)

  // If there are no lockable collections AND no lockable globals, don't create the collection
  if (lockableCollections.length === 0 && lockableGlobals.length === 0) {
    return null
  }

  // If there are no auth collections, we can't track who locked the document
  // so we shouldn't create the locked-documents collection
  if (authCollections.length === 0) {
    return null
  }

  const fields: CollectionConfig['fields'] = []

  // Only include the document field if there are lockable collections
  if (lockableCollections.length > 0) {
    fields.push({
      name: 'document',
      type: 'relationship',
      index: true,
      maxDepth: 0,
      relationTo: lockableCollections,
    })
  }

  // Always include globalSlug field for tracking global locks
  fields.push({
    name: 'globalSlug',
    type: 'text',
    index: true,
  })

  // Always include user field
  fields.push({
    name: 'user',
    type: 'relationship',
    maxDepth: 1,
    relationTo: authCollections,
    required: true,
  })

  return {
    slug: lockedDocumentsCollectionSlug,
    access: {
      create: canCreateLock,
      delete: ({ id, req }) => getAccessibleLocksWhere(req, 'update', id),
      read: ({ id, req }) => getAccessibleLocksWhere(req, 'read', id),
      update: canUpdateLock,
    },
    admin: {
      hidden: true,
    },
    authorship: false,
    fields,
    lockDocuments: false,
    versions: false,
  }
}
