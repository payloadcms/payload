import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { ManagedFileManifest } from './types.js'

import { APIError } from '../../errors/APIError.js'
import { archiveOutgoingLocalFiles, replaceManagedFileReferences } from './archive.js'
import { scheduleUnreferencedFileCleanup } from './cleanup.js'
import { runFileOperationPlan } from './fileOperationManager.js'
import { copyLocalFile } from './localStorage.js'
import { getManagedFileIdentity, withLegacyUploadFileData } from './manifest.js'
import { getArchivedFilename } from './naming.js'

/** Copies the selected stored files before making that version current. */
export const runManagedFileRestore = async <T>({
  id,
  collection,
  current,
  req,
  resolve,
  selected,
  write,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  id: number | string
  req: PayloadRequest
  resolve?: (restored: JsonObject) => Promise<JsonObject>
  selected: JsonObject
  write: (restored: JsonObject) => Promise<T>
}): Promise<T> => {
  const stored = withLegacyUploadFileData({
    collection,
    config: req.payload.config,
    doc: selected,
  }) as JsonObject
  const configuredSizeKeys = new Set(collection.upload.variants?.map(({ name }) => name) ?? [])
  const manifest: ManagedFileManifest = Array.isArray(stored._managedFiles)
    ? (stored._managedFiles as ManagedFileManifest).flatMap((file) => {
        const roles = file.roles.filter((role) =>
          resolve
            ? role.type === 'original' || role.type === 'thumbnail'
            : role.type !== 'size' || configuredSizeKeys.has(role.sizeKey),
        )
        return roles.length ? [{ ...file, roles }] : []
      })
    : []
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
              filename: null,
              filesize: null,
              height: null,
              mimeType: null,
              url: null,
              width: null,
            },
      ],
    ),
  )
  const selectedForCurrent = { ...stored, _managedFiles: manifest, variants: restoredVariants }

  const staticDir = collection.upload.staticDir
  const storageBackendId = `local:${collection.slug}`
  const cloudOperations = collection.upload.fileOperations
  for (const file of manifest) {
    const hasLocalBackend =
      !collection.upload.disableLocalStorage &&
      Boolean(staticDir) &&
      file.storageBackendId === storageBackendId
    const hasCloudBackend =
      Boolean(cloudOperations) && file.storageBackendId === cloudOperations?.storageBackendId

    if (!hasLocalBackend && !hasCloudBackend) {
      throw new APIError(`No configured storage backend can restore ${file.storageBackendId}.`, 400)
    }
  }

  const currentStored = withLegacyUploadFileData({
    collection,
    config: req.payload.config,
    doc: current,
  })
  const currentManifest = Array.isArray(currentStored._managedFiles)
    ? (currentStored._managedFiles as ManagedFileManifest)
    : []

  if (!manifest.length && !currentManifest.length) {
    return write(resolve ? await resolve(selectedForCurrent) : selectedForCurrent)
  }

  const currentIdentities = new Set(currentManifest.map(getManagedFileIdentity))
  const replacements = new Map<string, string>()
  let restored: JsonObject = selectedForCurrent

  return runFileOperationPlan({
    id,
    collection: collection.slug,
    req,
    stage: async ({ trackStagedObject }) => {
      for (const file of manifest) {
        if (currentIdentities.has(getManagedFileIdentity(file))) {
          continue
        }

        const directory = path.posix.dirname(file.key)
        const filename = getArchivedFilename({
          filename: path.posix.basename(file.key),
          versionID: randomUUID(),
        })
        const key = directory === '.' ? filename : `${directory}/${filename}`

        if (file.storageBackendId === storageBackendId && staticDir) {
          await copyLocalFile({ from: file.key, staticDir, to: key })
          trackStagedObject({
            key,
            remove: () => fs.rm(path.join(staticDir, key), { force: true }),
            storageBackendId,
          })
        } else if (cloudOperations) {
          await cloudOperations.copy({ from: file.key, req, to: key, trackStagedObject })
        } else {
          throw new Error(`No storage operation can restore ${file.storageBackendId}`)
        }
        replacements.set(getManagedFileIdentity(file), key)
      }

      restored =
        replaceManagedFileReferences({ replacements, version: selectedForCurrent }) ??
        selectedForCurrent
    },
    write: async ({ trackStagedObject }) => {
      if (resolve) {
        restored = await resolve(restored)
      }

      if (staticDir && !collection.upload.disableLocalStorage) {
        await archiveOutgoingLocalFiles({
          id,
          collection,
          current,
          nextManifest: (restored._managedFiles as ManagedFileManifest | undefined) ?? [],
          req,
          trackStagedObject,
        })
      }

      const result = await write(restored)

      await scheduleUnreferencedFileCleanup({
        candidates: currentManifest,
        collection,
        req,
      })

      return result
    },
  })
}
