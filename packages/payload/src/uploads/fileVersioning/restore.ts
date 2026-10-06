import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { StoredFileList } from './types.js'

import { APIError } from '../../errors/APIError.js'
import { archiveOutgoingLocalFiles, replaceStoredFileReferences } from './archive.js'
import { scheduleUnreferencedFileCleanup } from './cleanup.js'
import { runFileOperationPlan } from './fileOperationManager.js'
import { copyLocalFile } from './localStorage.js'
import { getArchivedFilename } from './naming.js'
import {
  collectStoredFiles,
  getStoredFileIdentity,
  withLegacyUploadFileData,
} from './storedFiles.js'

/** Copies the selected stored files before making that version current. */
export const runStoredFileRestore = async <T>({
  id,
  collection,
  current,
  req,
  selected,
  write,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  id: number | string
  req: PayloadRequest
  selected: JsonObject
  write: (restored: JsonObject) => Promise<T>
}): Promise<T> => {
  const stored = withLegacyUploadFileData({
    collection,
    config: req.payload.config,
    doc: selected,
  }) as JsonObject
  const configuredSizeKeys = new Set(collection.upload.variants?.map(({ name }) => name) ?? [])
  const storedFiles: StoredFileList = collectStoredFiles({ collection, doc: stored, req }).flatMap(
    (file) => {
      const roles = file.roles.filter(
        (role) => role.type !== 'size' || configuredSizeKeys.has(role.sizeKey),
      )
      return roles.length ? [{ ...file, roles }] : []
    },
  )
  const selectedVariants =
    stored.variants && typeof stored.variants === 'object' && !Array.isArray(stored.variants)
      ? stored.variants
      : {}
  const currentVariants =
    current.variants && typeof current.variants === 'object' && !Array.isArray(current.variants)
      ? current.variants
      : {}
  // SQL adapters flatten variant groups, so clearing the group alone leaves its fields behind.
  const restoredVariants = Object.fromEntries(
    [...new Set([...Object.keys(currentVariants), ...Object.keys(selectedVariants)])].map(
      (sizeKey) => [
        sizeKey,
        configuredSizeKeys.has(sizeKey) && selectedVariants[sizeKey]
          ? selectedVariants[sizeKey]
          : {
              _objectKey: null,
              filename: null,
              filesize: null,
              height: null,
              mimeType: null,
              prefix: null,
              url: null,
              width: null,
            },
      ],
    ),
  )
  const selectedForCurrent = { ...stored, variants: restoredVariants }

  const staticDir = collection.upload.staticDir
  const cloudOperations = collection.upload.fileOperations
  if (
    storedFiles.length &&
    !cloudOperations &&
    (collection.upload.disableLocalStorage || !staticDir)
  ) {
    throw new APIError('No configured storage adapter can restore this file.', 400)
  }

  const currentStored = withLegacyUploadFileData({
    collection,
    config: req.payload.config,
    doc: current,
  })
  const currentFiles = collectStoredFiles({ collection, doc: currentStored, req })

  if (!storedFiles.length && !currentFiles.length) {
    return write(selectedForCurrent)
  }

  const currentIdentities = new Set(currentFiles.map(getStoredFileIdentity))
  const replacements = new Map<string, string>()
  let restored: JsonObject = selectedForCurrent

  return runFileOperationPlan({
    id,
    collection: collection.slug,
    req,
    stage: async ({ trackStagedObject }) => {
      for (const file of storedFiles) {
        if (currentIdentities.has(getStoredFileIdentity(file))) {
          continue
        }

        const directory = path.posix.dirname(file.key)
        const filename = getArchivedFilename({
          filename: path.posix.basename(file.key),
          versionID: randomUUID(),
        })
        const key = directory === '.' ? filename : `${directory}/${filename}`

        if (!cloudOperations && staticDir) {
          await copyLocalFile({ from: file.key, staticDir, to: key })
          trackStagedObject({
            key,
            remove: () => fs.rm(path.join(staticDir, key), { force: true }),
          })
        } else if (cloudOperations) {
          await cloudOperations.copy({ from: file.key, req, to: key, trackStagedObject })
        } else {
          throw new Error('No storage operation can restore this file')
        }
        replacements.set(getStoredFileIdentity(file), key)
      }

      restored =
        replaceStoredFileReferences({
          files: storedFiles,
          replacements,
          version: selectedForCurrent,
        }) ?? selectedForCurrent
    },
    write: async ({ trackStagedObject }) => {
      if (staticDir && !collection.upload.disableLocalStorage) {
        await archiveOutgoingLocalFiles({
          id,
          collection,
          current,
          next: restored,
          req,
          trackStagedObject,
        })
      }

      const result = await write(restored)

      await scheduleUnreferencedFileCleanup({
        candidates: currentFiles,
        collection,
        req,
      })

      return result
    },
  })
}
