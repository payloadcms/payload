import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'

import { saveVersion } from '../../versions/saveVersion.js'
import {
  collectStoredFiles as collectSavedFiles,
  removeUnreferencedStagedObjects,
  scheduleUnreferencedFileCleanup,
} from './cleanup.js'
import { runFileCreationPlan, runFileOperationPlan } from './fileOperationManager.js'
import {
  collectStoredFiles,
  getStoredFileIdentity,
  withLegacyCloudUploadFileData,
} from './storedFiles.js'

/** Preserve the caller's cloud flags; nested Local API calls can replace req.context. */
export const captureCloudHookState = ({ req }: { req: PayloadRequest }): (() => void) => {
  const previousState = ['_payloadManagedCloudStorage', '_payloadManagedCloudMetadata'].map(
    (key) => ({
      hasProperty: Object.hasOwn(req.context ?? {}, key),
      key,
      value: req.context?.[key],
    }),
  )

  return () => {
    req.context ??= {}
    for (const { hasProperty, key, value } of previousState) {
      if (hasProperty) {
        req.context[key] = value
      } else {
        delete req.context[key]
      }
    }
  }
}

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
    cleanupStagedAfterWriteFailure: (objects) =>
      removeUnreferencedStagedObjects({ collection, objects, req }),
    req,
    stage: async ({ trackStagedObject }) => {
      const staged = await operations.stage({
        data,
        files,
        req,
        trackStagedObject,
      })
      metadata = staged.metadata
      Object.assign(data, metadata)
    },
    // Create's version and afterChange hooks run after the database insert. The
    // outer create operation restores the previous guard after those hooks finish.
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
  const nextFiles = collectStoredFiles({
    collection,
    doc: { ...storedCurrent, ...data },
    req,
    trustGenerated: true,
  })
  const currentFiles = collectStoredFiles({ collection, doc: storedCurrent, req })
  const nextIdentities = new Set(nextFiles.map(getStoredFileIdentity))
  const hasStoredFileChange =
    nextIdentities.size !== currentFiles.length ||
    currentFiles.some((file) => !nextIdentities.has(getStoredFileIdentity(file)))

  if (
    !operations ||
    req.context?.skipCloudStorage ||
    (files.length === 0 && !req.context?._payloadVerifiedProviderOriginal && !hasStoredFileChange)
  ) {
    return write()
  }

  let metadata: Record<string, unknown> = {}

  return runFileOperationPlan({
    cleanupStagedAfterWriteFailure: (objects) =>
      removeUnreferencedStagedObjects({ collection, objects, req }),
    req,
    stage: async ({ trackStagedObject }) => {
      if (files.length === 0 && !req.context?._payloadVerifiedProviderOriginal) {
        return
      }
      const staged = await operations.stage({
        data,
        files,
        req,
        trackStagedObject,
      })
      metadata = staged.metadata
      Object.assign(data, metadata)
    },
    write: async () => {
      if (
        collection.versions &&
        !hasStoredOriginal({ doc: current }) &&
        hasStoredOriginal({ doc: storedCurrent })
      ) {
        await persistLegacyCloudVersions({ id, collection, current: storedCurrent, req })
      }

      const result = await withCloudHookGuard({
        metadata,
        req,
        write,
      })

      await scheduleUnreferencedFileCleanup({
        candidates: collectSavedFiles({ collection, doc: storedCurrent, req }),
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
      if (hasStoredOriginal({ doc: row.version })) {
        continue
      }

      const version = await withLegacyCloudUploadFileData({
        collection,
        doc: row.version,
        req,
      })
      if (!hasStoredOriginal({ doc: version })) {
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

  if (!hasVersions && hasStoredOriginal({ doc: current })) {
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

const hasStoredOriginal = ({ doc }: { doc: JsonObject }): boolean =>
  Boolean(
    doc.original &&
      typeof doc.original === 'object' &&
      typeof (doc.original as Record<string, unknown>).filename === 'string',
  )

const withCloudHookGuard = async <T>({
  metadata,
  req,
  write,
}: {
  metadata: Record<string, unknown>
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  const restoreCloudHookState = captureCloudHookState({ req })
  req.context ??= {}
  req.context._payloadManagedCloudStorage = true
  req.context._payloadManagedCloudMetadata = metadata

  try {
    return await write()
  } finally {
    restoreCloudHookState()
  }
}
