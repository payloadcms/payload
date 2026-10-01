import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'

import { saveVersion } from '../../versions/saveVersion.js'
import { collectManagedFiles, scheduleUnreferencedFileCleanup } from './cleanup.js'
import { runFileCreationPlan, runFileOperationPlan } from './fileOperationManager.js'
import { withLegacyCloudUploadFileData } from './manifest.js'

export const runCloudFileCreation = async <T>({
  collection,
  data,
  files,
  req,
  write,
}: {
  collection: SanitizedCollectionConfig
  data: JsonObject
  files: FileToSave[]
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  const operations = collection.upload.fileOperations

  if (
    !operations ||
    req.context?.skipCloudStorage ||
    (files.length === 0 && !req.context?._payloadVerifiedProviderOriginal)
  ) {
    return write()
  }

  let metadata: Record<string, unknown> = {}

  return runFileCreationPlan({
    req,
    stage: async ({ trackStagedObject }) => {
      const staged = await operations.stage({
        data,
        files,
        req,
        trackStagedObject,
      })
      metadata = staged.metadata
      Object.assign(data, metadata, { _managedFiles: staged.managedFiles })
    },
    // Create's version and afterChange hooks run after the database insert. The
    // outer create operation clears this guard once those hooks have completed.
    write: () => {
      req.context ??= {}
      req.context._payloadManagedCloudStorage = true
      req.context._payloadManagedCloudMetadata = metadata
      return write()
    },
  })
}

export const runCloudFileUpdate = async <T>({
  id,
  collection,
  current,
  data,
  files,
  req,
  write,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  data: JsonObject
  files: FileToSave[]
  id: number | string
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  const operations = collection.upload.fileOperations
  const storedCurrent = operations
    ? await withLegacyCloudUploadFileData({ collection, doc: current, req })
    : current
  const hasManagedRemoval =
    Array.isArray(data._managedFiles) &&
    data._managedFiles.length === 0 &&
    Array.isArray(storedCurrent._managedFiles) &&
    storedCurrent._managedFiles.length > 0

  if (
    !operations ||
    req.context?.skipCloudStorage ||
    (files.length === 0 && !req.context?._payloadVerifiedProviderOriginal && !hasManagedRemoval)
  ) {
    return write()
  }

  let metadata: Record<string, unknown> = {}

  return runFileOperationPlan({
    id,
    collection: collection.slug,
    req,
    stage: async ({ trackStagedObject }) => {
      const staged = await operations.stage({
        data: { ...storedCurrent, ...data },
        files,
        req,
        trackStagedObject,
      })
      metadata = staged.metadata
      Object.assign(data, metadata, { _managedFiles: staged.managedFiles })
    },
    write: async () => {
      if (
        collection.versions &&
        !Array.isArray(current._managedFiles) &&
        Array.isArray(storedCurrent._managedFiles)
      ) {
        await persistLegacyCloudVersions({ id, collection, current: storedCurrent, req })
      }

      const result = await withCloudHookGuard({ metadata, req, write })

      await scheduleUnreferencedFileCleanup({
        candidates: collectManagedFiles({ collection, doc: storedCurrent, req }),
        collection,
        req,
      })

      return result
    },
  })
}

const persistLegacyCloudVersions = async ({
  id,
  collection,
  current,
  req,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  id: number | string
  req: PayloadRequest
}): Promise<void> => {
  let page = 1
  let hasVersions = false

  while (true) {
    const versions = await req.payload.db.findVersions<JsonObject>({
      collection: collection.slug,
      limit: 100,
      page,
      req,
      where: { parent: { equals: id } },
    })

    for (const row of versions.docs) {
      hasVersions = true
      if (Array.isArray(row.version._managedFiles)) {
        continue
      }

      const version = await withLegacyCloudUploadFileData({
        collection,
        doc: row.version,
        req,
      })
      if (!Array.isArray(version._managedFiles)) {
        continue
      }

      await req.payload.db.updateVersion({
        id: row.id,
        collection: collection.slug,
        req,
        versionData: {
          createdAt: row.createdAt,
          latest: row.latest,
          parent: row.parent,
          publishedLocale: row.publishedLocale,
          updatedAt: row.updatedAt,
          version,
        },
      })
    }

    if (versions.docs.length < 100) {
      break
    }
    page += 1
  }

  if (!hasVersions && Array.isArray(current._managedFiles)) {
    await saveVersion({
      id,
      collection,
      docWithLocales: current,
      draft: false,
      operation: 'update',
      payload: req.payload,
      req,
    })
  }
}

const withCloudHookGuard = async <T>({
  metadata,
  req,
  write,
}: {
  metadata: Record<string, unknown>
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  req.context ??= {}
  req.context._payloadManagedCloudStorage = true
  req.context._payloadManagedCloudMetadata = metadata

  try {
    return await write()
  } finally {
    delete req.context._payloadManagedCloudStorage
    delete req.context._payloadManagedCloudMetadata
  }
}
