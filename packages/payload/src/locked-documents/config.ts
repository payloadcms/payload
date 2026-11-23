import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

type LockTarget = {
  document?: { relationTo: string; value: number | string } | null
  globalSlug?: null | string
}

const canAccessLockTarget = async (
  req: PayloadRequest,
  target: LockTarget,
  operation: 'read' | 'update',
): Promise<boolean> => {
  if (!req.user || !target || Boolean(target.document) === Boolean(target.globalSlug)) {
    return false
  }

  if (target.globalSlug) {
    const global = req.payload.config.globals.find(({ slug }) => slug === target.globalSlug)

    if (!global) {
      return false
    }

    const access = await executeAccess({ disableErrors: true, req }, global.access[operation])

    if (access === true) {
      return true
    }
    if (!access) {
      return false
    }

    const doc = await req.payload.db.findGlobal({ slug: target.globalSlug, req, where: access })
    return Boolean(doc && Object.keys(doc).length)
  }

  const { relationTo, value } = target.document!
  const collection = req.payload.collections[relationTo]?.config

  if (!collection || value === undefined || value === null) {
    return false
  }

  const access = await executeAccess(
    { id: value, disableErrors: true, req },
    collection.access[operation],
  )

  if (!access) {
    return false
  }

  const { totalDocs } = await req.payload.db.count({
    collection: relationTo,
    req,
    where:
      access === true ? { id: { equals: value } } : { and: [{ id: { equals: value } }, access] },
  })

  return totalDocs > 0
}

const accessibleLockRows = async (
  req: PayloadRequest,
  operation: 'read' | 'update',
  id?: number | string,
): Promise<boolean | Where> => {
  if (!req.user) {
    return false
  }

  // List access receives no query filter, so authorize each lock's target before returning row IDs.
  const { docs } = await req.payload.db.find<{ id: number | string } & LockTarget>({
    collection: lockedDocumentsCollectionSlug,
    limit: 0,
    pagination: false,
    req,
    select: { id: true, document: true, globalSlug: true },
    ...(id === undefined ? {} : { where: { id: { equals: id } } }),
  })

  const allowedIds: (number | string)[] = []

  for (const lock of docs) {
    if (await canAccessLockTarget(req, lock, operation)) {
      allowedIds.push(lock.id)
    }
  }

  if (id !== undefined) {
    return allowedIds.length > 0
  }

  return allowedIds.length > 0 ? { id: { in: allowedIds } } : { id: { exists: false } }
}

const canCreateLock: Access = ({ data, req }) =>
  canAccessLockTarget(req, data as LockTarget, 'update')

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
      delete: ({ id, req }) => accessibleLockRows(req, 'update', id),
      read: ({ id, req }) => accessibleLockRows(req, 'read', id),
      update: ({ id, data, req }) => {
        if (data && ('document' in data || 'globalSlug' in data)) {
          return false
        }

        return accessibleLockRows(req, 'update', id)
      },
    },
    admin: {
      hidden: true,
    },
    fields,
    lockDocuments: false,
  }
}
