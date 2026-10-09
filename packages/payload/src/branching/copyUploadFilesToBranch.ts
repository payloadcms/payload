import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { replaceStoredFileReferences } from '../uploads/fileVersioning/archive.js'
import { removeUnreferencedStagedObjects } from '../uploads/fileVersioning/cleanup.js'
import { runFileOperationPlan } from '../uploads/fileVersioning/fileOperationManager.js'
import { copyLocalFile } from '../uploads/fileVersioning/localStorage.js'
import { normalizeStorageKey } from '../uploads/fileVersioning/naming.js'
import {
  collectStoredFiles,
  getStoredFileIdentity,
  withLegacyCloudUploadFileData,
  withLegacyUploadFileData,
} from '../uploads/fileVersioning/storedFiles.js'
import { getBranchUploadFilename } from '../uploads/generateFileData.js'
import { getSafeFileName, incrementName } from '../uploads/getSafeFilename.js'
import { markTransactionWrite } from '../utilities/transactionMutationTracker.js'

export const copyUploadFilesToBranch = async ({
  branch,
  collection,
  doc,
  req,
}: {
  branch: string
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  req: PayloadRequest
}): Promise<Record<string, unknown>> => {
  if (!collection.upload) {
    return doc
  }

  const stored = collection.upload.fileOperations
    ? await withLegacyCloudUploadFileData({ collection, doc, req })
    : withLegacyUploadFileData({ collection, config: req.payload.config, doc })
  const storedFiles = collectStoredFiles({ collection, doc: stored, req })

  if (!storedFiles.length) {
    return doc
  }

  const persistedPrefix = typeof stored.prefix === 'string' ? stored.prefix : undefined
  const replacements = new Map<string, string>()
  const reservedKeys = new Set(storedFiles.map(getStoredFileIdentity))

  for (const file of storedFiles) {
    const directory = path.posix.dirname(file.key)
    let filename = getBranchUploadFilename({
      branch,
      filename: path.posix.basename(file.key),
    })

    while (true) {
      filename = await getSafeFileName({
        collectionSlug: collection.slug,
        desiredFilename: filename,
        prefix: persistedPrefix,
        req,
        staticPath:
          collection.upload.staticDir && !collection.upload.fileOperations
            ? path.join(collection.upload.staticDir, directory === '.' ? '' : directory)
            : undefined,
      })

      const key = normalizeStorageKey({
        key: directory === '.' ? filename : path.posix.join(directory, filename),
      })

      if (!reservedKeys.has(key)) {
        replacements.set(getStoredFileIdentity(file), key)
        reservedKeys.add(key)
        break
      }

      filename = incrementName(filename)
    }
  }
  const branchDocument = replaceStoredFileReferences({
    files: storedFiles,
    replacements,
    version: stored as JsonObject,
  })

  if (!branchDocument) {
    return doc
  }

  const fileOperations = collection.upload.fileOperations
  const staticDir = collection.upload.staticDir

  return runFileOperationPlan({
    cleanupStagedAfterWriteFailure: (objects) =>
      removeUnreferencedStagedObjects({ collection, objects, req }),
    req,
    stage: async ({ trackStagedObject }) => {
      for (const file of storedFiles) {
        const to = replacements.get(getStoredFileIdentity(file))!

        if (fileOperations) {
          await fileOperations.copy({ from: file.key, req, to, trackStagedObject })
        } else if (staticDir) {
          await copyLocalFile({ from: file.key, staticDir, to })
          trackStagedObject({
            key: to,
            remove: () => fs.rm(path.join(staticDir, to), { force: true }),
          })
        } else {
          throw new Error(`Unable to copy upload files for collection ${collection.slug}`)
        }
      }
    },
    write: async () => {
      const updated = await req.payload.db.updateOne({
        id: doc.id as number | string,
        branch: false,
        collection: collection.slug,
        data: {
          filename: branchDocument.filename,
          original: branchDocument.original,
          url: branchDocument.url,
          variants: branchDocument.variants,
        },
        req,
      })

      markTransactionWrite({ req })

      return updated
    },
  }) as Promise<Record<string, unknown>>
}
