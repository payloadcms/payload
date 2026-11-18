import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'
import type { JsonObject, PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

type Operation = 'read' | 'update'

const hasDocumentTarget = (
  document: unknown,
): document is { relationTo: string; value: number | string } => {
  if (!document || typeof document !== 'object') {
    return false
  }
  const { relationTo, value } = document as { relationTo?: unknown; value?: unknown }
  return (
    typeof relationTo === 'string' &&
    relationTo.length > 0 &&
    value !== undefined &&
    value !== null
  )
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
      validLocks.push(lock)
      globalSlugs.add(lock.globalSlug)
    } else if (hasDocumentTarget(lock.document)) {
      validLocks.push(lock)
      let ids = idsByCollection.get(lock.document.relationTo)
      if (!ids) {
        ids = new Set()
        idsByCollection.set(lock.document.relationTo, ids)
      }
      ids.add(lock.document.value)
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
      return allowedGlobals.has(lock.globalSlug)
    }
    if (lock.document?.relationTo) {
      return Boolean(
        allowedTargetIdsByCollection.get(lock.document.relationTo)?.has(String(lock.document.value)),
      )
    }
    return false
  })
}

/**
 * Converts accessible lock rows into a `Where` selecting them by ID
 * (`{ id: { exists: false } }` when authenticated with zero accessible locks so list queries
 * return an empty result set rather than 403, and `false` when unauthenticated).
 */
const locksToWhere = (locks: (JsonObject & TypeWithID)[] | null): boolean | Where => {
  if (!locks) {
    return false
  }
  return locks.length ? { id: { in: locks.map((lock) => lock.id) } } : { id: { exists: false } }
}

const getAccessibleLocksWhere = async (
  req: PayloadRequest,
  operation: Operation,
  id?: number | string,
): Promise<boolean | Where> => locksToWhere(await getAccessibleLocks(req, operation, id))

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
    document?: { relationTo?: string; value?: number | string } | null
    globalSlug?: string | null
  }

  const hasGlobal = Boolean(globalSlug)
  const hasDoc = document !== undefined && document !== null

  if (hasGlobal && hasDoc) {
    return false
  }

  if (globalSlug) {
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

  if (!hasDocumentTarget(document)) {
    return false
  }

  const config = payload.collections[document.relationTo]?.config

  if (!config) {
    return false
  }

  const result = await executeAccess(
    { id: document.value, disableErrors: true, req, slug: document.relationTo },
    config.access.update as Access,
  )

  if (!result || result === true) {
    return Boolean(result)
  }

  const { totalDocs } = await payload.db.count({
    collection: document.relationTo,
    req,
    where: { and: [{ id: { equals: document.value } }, result] },
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
    if (!hasNextGlobal && !hasDocumentTarget(nextDocument)) {
      return false
    }
    return true
  })

  if (accessibleLocks.length > 0 && !compatibleLocks.length) {
    return false
  }

  return locksToWhere(compatibleLocks)
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
