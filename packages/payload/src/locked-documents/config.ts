import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'
import type { JsonObject, PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

type Operation = 'read' | 'update'

/**
 * Lock rows are only as visible/editable as the document or global they point at.
 * Returns a `Where` selecting the existing lock rows whose target the user may `operation`
 * (`{ id: { exists: false } }` when authenticated with zero accessible locks so list queries
 * return an empty result set rather than 403, and `false` when unauthenticated).
 */
const getAccessibleLocksWhere = async (
  req: PayloadRequest,
  operation: Operation,
  id?: number | string,
): Promise<boolean | Where> => {
  if (!req.user) {
    return false
  }

  const { payload } = req

  const locks = await payload.db.find<JsonObject & TypeWithID>({
    collection: lockedDocumentsCollectionSlug,
    limit: 0,
    pagination: false,
    req,
    ...(id !== undefined ? { where: { id: { equals: id } } } : {}),
  })

  const idsByCollection: Record<string, (number | string)[]> = {}
  const globalSlugs = new Set<string>()

  for (const lock of locks.docs) {
    if (lock.globalSlug) {
      globalSlugs.add(lock.globalSlug)
    } else if (lock.document?.relationTo) {
      ;(idsByCollection[lock.document.relationTo] ??= []).push(lock.document.value)
    }
  }

  const or: Where[] = []

  for (const [slug, ids] of Object.entries(idsByCollection)) {
    const config = payload.collections[slug]?.config

    if (!config) {
      continue
    }

    const result = await executeAccess(
      { disableErrors: true, req, slug },
      config.access[operation] as Access,
    )

    let allowedIds = ids

    if (!result) {
      continue
    }

    if (result !== true) {
      const matches = await payload.db.find<TypeWithID>({
        collection: slug,
        limit: 0,
        pagination: false,
        req,
        select: { id: true },
        where: { and: [{ id: { in: ids } }, result] },
      })
      allowedIds = matches.docs.map((doc) => doc.id)
    }

    if (allowedIds.length) {
      or.push({
        and: [
          { 'document.relationTo': { equals: slug } },
          { 'document.value': { in: allowedIds } },
        ],
      })
    }
  }

  const allowedGlobals: string[] = []

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
      allowedGlobals.push(slug)
    } else if (result) {
      const globalDoc = await payload.db.findGlobal({
        slug,
        req,
        where: result,
      })

      if (globalDoc && Object.keys(globalDoc).length > 0) {
        allowedGlobals.push(slug)
      }
    }
  }

  if (allowedGlobals.length) {
    or.push({ globalSlug: { in: allowedGlobals } })
  }

  return or.length ? { or } : { id: { exists: false } }
}

/**
 * Locking a document or global needs the same access as editing it.
 * Without a target there is nothing to authorize, so the row is rejected.
 */
const canCreateLock: Access = async ({ data, req }) => {
  if (!req.user || !data) {
    return false
  }

  const { payload } = req
  const { document, globalSlug } = data as {
    document?: { relationTo?: string; value?: number | string }
    globalSlug?: string
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

  if (!document?.relationTo || document.value === undefined || document.value === null) {
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
      update: ({ id, req }) => getAccessibleLocksWhere(req, 'update', id),
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
