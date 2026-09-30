import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'

import { runFileCreationPlan, runFileOperationPlan } from './fileOperationManager.js'

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
  data,
  files,
  req,
  write,
}: {
  collection: SanitizedCollectionConfig
  data: JsonObject
  files: FileToSave[]
  id: number | string
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

  return runFileOperationPlan({
    id,
    collection: collection.slug,
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
    write: () => withCloudHookGuard({ metadata, req, write }),
  })
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
