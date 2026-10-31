import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest, SelectType, Where } from '../../types/index.js'
import type { StagedObject } from './fileOperationManager.js'
import type { StoredFile, StoredFileList } from './types.js'

import { deferFileCleanup } from './fileOperationManager.js'
import { normalizeStorageKey } from './naming.js'
import {
  collectStoredFiles as collectStoredFileLocations,
  getStoredFileIdentity,
  withLegacyCloudUploadFileData,
} from './storedFiles.js'

const pageSize = 100

export const collectStoredFiles = async ({
  collection,
  doc,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: JsonObject
  req: PayloadRequest
}): Promise<StoredFileList> => {
  const stored = await withLegacyCloudUploadFileData({
    collection,
    doc,
    req,
  })

  return collectStoredFileLocations({ collection, doc: stored, req })
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
}): Promise<StoredFileList> => {
  const files: StoredFileList = []
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
      files.push(...(await collectStoredFiles({ collection, doc: row.version, req })))
    }

    if (versions.docs.length < pageSize) {
      return files
    }
    page += 1
  }
}

/** Collects every stored file that can become unreferenced when a document is deleted. */
export const collectDocumentDeleteFileCandidates = async ({
  collection,
  doc,
  parentID,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: JsonObject
  parentID: number | string
  req: PayloadRequest
}): Promise<StoredFileList> => [
  ...(await collectStoredFiles({ collection, doc, req })),
  ...(collection.versions ? await collectVersionFiles({ collection, parentID, req }) : []),
]

/** Confirms that deleted references have no survivors before and after commit. */
export const scheduleUnreferencedFileCleanup = async ({
  candidates,
  collection,
  req,
}: {
  candidates: StoredFileList
  collection: SanitizedCollectionConfig
  req: PayloadRequest
}): Promise<void> => {
  const unique = new Map(candidates.map((file) => [getStoredFileIdentity(file), file]))

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
          await deleteStoredFile({ collection, file, req })
        } catch (err) {
          req.payload.logger.error({
            err,
            msg: `Failed to delete unreferenced upload file ${file.key}. Verify the object is unreferenced and remove it manually.`,
          })
        }
      }
    },
    req,
    shouldCleanupAfterFailure: true,
  })
}

/** Removes objects staged by a failed write unless a persisted document or version references them. */
export const removeUnreferencedStagedObjects = async ({
  collection,
  objects,
  req,
}: {
  collection: SanitizedCollectionConfig
  objects: StagedObject[]
  req: PayloadRequest
}): Promise<void> => {
  const unreferenced = await findUnreferenced({
    candidates: objects.map(({ key }) => ({ key, roles: [] })),
    collection,
    req,
  })
  const identities = new Set(unreferenced.map(getStoredFileIdentity))

  for (const object of objects) {
    if (!identities.has(getStoredFileIdentity(object))) {
      continue
    }

    try {
      await object.remove()
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `Failed to remove staged upload file ${object.key}`,
      })
    }
  }
}

const findUnreferenced = async ({
  candidates,
  collection,
  req,
}: {
  candidates: StoredFileList
  collection: SanitizedCollectionConfig
  req: PayloadRequest
}): Promise<StoredFileList> => {
  const variantsField = collection.flattenedFields.find((field) => field.name === 'variants')
  const variantNames =
    variantsField?.type === 'group'
      ? variantsField.flattenedFields
          .filter(
            (field) =>
              field.type === 'group' &&
              field.flattenedFields.some((nested) => nested.name === 'filename'),
          )
          .map((field) => field.name)
      : []
  const filenamePaths = [
    'filename',
    'original.filename',
    ...variantNames.map((name) => `variants.${name}.filename`),
  ]
  // A removed schema field cannot prove the absence of historical references.
  // Retain those variant objects until their saved location data is migrated.
  const remaining = new Map(
    candidates
      .filter((file) =>
        file.roles.every((role) => role.type !== 'size' || variantNames.includes(role.sizeKey)),
      )
      .map((file) => [getStoredFileIdentity(file), file]),
  )
  const representationSelect: SelectType = {
    _objectKey: true,
    filename: true,
    prefix: true,
    url: true,
  }
  const select: SelectType = {
    ...representationSelect,
    filesize: true,
    mimeType: true,
    original: representationSelect,
    ...(variantNames.length
      ? { variants: Object.fromEntries(variantNames.map((name) => [name, representationSelect])) }
      : {}),
  }
  // Legacy filenames may include folders. Match every possible filename suffix,
  // then verify the adapter's complete key before accepting a reference.
  const filenames = [
    ...new Set(
      [...remaining.values()].flatMap(({ key }) => {
        const parts = normalizeStorageKey({ key }).split('/')
        return parts.map((_, index) => parts.slice(index).join('/'))
      }),
    ),
  ]

  for (let offset = 0; offset < filenames.length && remaining.size; offset += pageSize) {
    const batch = filenames.slice(offset, offset + pageSize)
    const where: Where = { or: filenamePaths.map((field) => ({ [field]: { in: batch } })) }
    let page = 1

    while (remaining.size) {
      const docs = await req.payload.db.find<JsonObject>({
        collection: collection.slug,
        limit: pageSize,
        page,
        pagination: true,
        req,
        select,
        sort: 'id',
        where,
      })

      for (const doc of docs.docs) {
        await removeReferenced({ collection, doc, remaining, req })
      }
      if (docs.docs.length < pageSize) {
        break
      }
      page += 1
    }

    if (collection.versions) {
      page = 1
      const versionWhere: Where = {
        or: filenamePaths.map((field) => ({ [`version.${field}`]: { in: batch } })),
      }

      while (remaining.size) {
        const versions = await req.payload.db.findVersions<JsonObject>({
          collection: collection.slug,
          limit: pageSize,
          page,
          pagination: true,
          req,
          select: { version: select },
          sort: 'id',
          where: versionWhere,
        })

        for (const row of versions.docs) {
          await removeReferenced({ collection, doc: row.version, remaining, req })
        }
        if (versions.docs.length < pageSize) {
          break
        }
        page += 1
      }
    }
  }

  return [...remaining.values()]
}

const removeReferenced = async ({
  collection,
  doc,
  remaining,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: JsonObject
  remaining: Map<string, StoredFile>
  req: PayloadRequest
}): Promise<void> => {
  for (const file of await collectStoredFiles({ collection, doc, req })) {
    remaining.delete(getStoredFileIdentity(file))
  }
}

const deleteStoredFile = async ({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  file: StoredFile
  req: PayloadRequest
}): Promise<void> => {
  const operations = collection.upload.fileOperations
  if (!operations) {
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

  await operations.delete({ key: file.key, req })
}
