import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, Where } from '../../types/index.js'
import type { ManagedFile, ManagedFileManifest } from './types.js'

import { deferFileCleanup } from './fileOperationManager.js'
import { getManagedFileIdentity, withLegacyUploadFileData } from './manifest.js'
import { normalizeStorageKey } from './naming.js'

const pageSize = 100

export const collectManagedFiles = ({
  collection,
  doc,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: JsonObject
  req: PayloadRequest
}): ManagedFileManifest => {
  const stored = withLegacyUploadFileData({
    collection,
    config: req.payload.config,
    doc,
  })

  return Array.isArray(stored._managedFiles) ? (stored._managedFiles as ManagedFileManifest) : []
}

/** Reads all saved versions in batches before a parent or its history is deleted. */
export const collectVersionFiles = async ({
  collection,
  parentID,
  req,
  where,
}: {
  collection: SanitizedCollectionConfig
  parentID: number | string
  req: PayloadRequest
  where?: Where
}): Promise<ManagedFileManifest> => {
  const files: ManagedFileManifest = []
  let page = 1

  while (true) {
    const versions = await req.payload.db.findVersions<JsonObject>({
      collection: collection.slug,
      limit: pageSize,
      page,
      req,
      where: where
        ? { and: [{ parent: { equals: parentID } }, where] }
        : { parent: { equals: parentID } },
    })

    for (const row of versions.docs) {
      files.push(...collectManagedFiles({ collection, doc: row.version, req }))
    }

    if (versions.docs.length < pageSize) {
      return files
    }
    page += 1
  }
}

/** Confirms that deleted references have no survivors before and after commit. */
export const scheduleUnreferencedFileCleanup = async ({
  candidates,
  collection,
  req,
}: {
  candidates: ManagedFileManifest
  collection: SanitizedCollectionConfig
  req: PayloadRequest
}): Promise<void> => {
  const unique = new Map(candidates.map((file) => [getManagedFileIdentity(file), file]))

  if (!unique.size) {
    return
  }

  const unreferenced = await findUnreferenced({ candidates: [...unique.values()], collection, req })

  if (!unreferenced.length) {
    return
  }

  await deferFileCleanup({
    cleanup: async () => {
      const stillUnreferenced = await findUnreferenced({
        candidates: unreferenced,
        collection,
        req,
      })

      for (const file of stillUnreferenced) {
        try {
          await deleteManagedFile({ collection, file, req })
        } catch (err) {
          req.payload.logger.error({
            err,
            msg: `Failed to delete unreferenced upload file ${file.storageBackendId}:${file.key}. Verify the object is unreferenced and remove it manually.`,
          })
        }
      }
    },
    req,
  })
}

const findUnreferenced = async ({
  candidates,
  collection,
  req,
}: {
  candidates: ManagedFileManifest
  collection: SanitizedCollectionConfig
  req: PayloadRequest
}): Promise<ManagedFileManifest> => {
  const remaining = new Map(candidates.map((file) => [getManagedFileIdentity(file), file]))
  let page = 1

  while (remaining.size) {
    const docs = await req.payload.db.find<JsonObject>({
      collection: collection.slug,
      limit: pageSize,
      page,
      req,
    })

    for (const doc of docs.docs) {
      removeReferenced({ collection, doc, remaining, req })
    }

    if (docs.docs.length < pageSize) {
      break
    }
    page += 1
  }

  if (collection.versions) {
    page = 1

    while (remaining.size) {
      const versions = await req.payload.db.findVersions<JsonObject>({
        collection: collection.slug,
        limit: pageSize,
        page,
        req,
      })

      for (const row of versions.docs) {
        removeReferenced({ collection, doc: row.version, remaining, req })
      }

      if (versions.docs.length < pageSize) {
        break
      }
      page += 1
    }
  }

  return [...remaining.values()]
}

const removeReferenced = ({
  collection,
  doc,
  remaining,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: JsonObject
  remaining: Map<string, ManagedFile>
  req: PayloadRequest
}): void => {
  for (const file of collectManagedFiles({ collection, doc, req })) {
    remaining.delete(getManagedFileIdentity(file))
  }
}

const deleteManagedFile = async ({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  file: ManagedFile
  req: PayloadRequest
}): Promise<void> => {
  if (file.storageBackendId === `local:${collection.slug}`) {
    const staticDir = collection.upload.staticDir

    if (!staticDir) {
      throw new Error(`No local storage directory is configured for ${collection.slug}`)
    }

    const key = normalizeStorageKey({ key: file.key })
    const directory = await fs.realpath(staticDir)
    const target = path.resolve(directory, key)
    const relative = path.relative(directory, target)

    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Invalid local storage key: ${key}`)
    }

    try {
      const parent = await fs.realpath(path.dirname(target))
      const parentRelative = path.relative(directory, parent)

      if (parentRelative.startsWith('..') || path.isAbsolute(parentRelative)) {
        throw new Error(`Local storage key escapes its directory: ${key}`)
      }

      await fs.unlink(target)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    }

    return
  }

  const operations = collection.upload.fileOperations

  if (operations?.storageBackendId !== file.storageBackendId) {
    throw new Error(`No storage adapter is configured for ${file.storageBackendId}`)
  }

  await operations.delete({ key: file.key, req })
}
