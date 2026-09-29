import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'
import type { StagedObject } from './fileOperationManager.js'
import type { ManagedFileManifest } from './types.js'

import { saveVersion } from '../../versions/saveVersion.js'
import { runFileOperationPlan, stageLocalUploadFiles } from './fileOperationManager.js'
import { copyLocalFile } from './localStorage.js'
import { getManagedFileIdentity, synthesizeLegacyUploadState } from './manifest.js'
import { getArchivedFilename } from './naming.js'

type VersionRow = {
  createdAt: string
  id: number | string
  latest?: boolean
  parent: number | string
  publishedLocale?: string
  updatedAt: string
  version: JsonObject
}

export const runLocalFileUpdate = async <T>({
  id,
  collection,
  current,
  files,
  nextManifest,
  req,
  write,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  files: FileToSave[]
  id: number | string
  nextManifest: unknown
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  if (
    !hasLocalFileChange({
      collection,
      config: req.payload.config,
      current,
      hasNewFiles: files.length > 0,
      nextManifest,
    })
  ) {
    return write()
  }

  return runFileOperationPlan({
    id,
    collection: collection.slug,
    req,
    stage: ({ trackStagedObject }) =>
      stageLocalUploadFiles({
        files,
        staticDir: collection.upload.staticDir!,
        storageBackendId: `local:${collection.slug}`,
        trackStagedObject,
      }),
    write: async ({ trackStagedObject }) => {
      await archiveOutgoingLocalFiles({
        id,
        collection,
        current,
        nextManifest: nextManifest as ManagedFileManifest,
        req,
        trackStagedObject,
      })

      return write()
    },
  })
}

/** Also detects removals, which have no new upload to stage. */
const hasLocalFileChange = ({
  collection,
  config,
  current,
  hasNewFiles,
  nextManifest,
}: {
  collection: SanitizedCollectionConfig
  config: Pick<Config, 'routes' | 'serverURL'>
  current: JsonObject
  hasNewFiles: boolean
  nextManifest: unknown
}): boolean =>
  !collection.upload.disableLocalStorage &&
  Array.isArray(nextManifest) &&
  (hasNewFiles ||
    getOutgoingLocalFiles({
      collection,
      config,
      current,
      nextManifest: nextManifest as ManagedFileManifest,
    }).length > 0)

/** Preserves outgoing local objects and repairs every retained version that referenced them. */
export const archiveOutgoingLocalFiles = async ({
  id,
  collection,
  current,
  nextManifest,
  req,
  trackStagedObject,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  id: number | string
  nextManifest: ManagedFileManifest
  req: PayloadRequest
  trackStagedObject: (object: StagedObject) => void
}): Promise<void> => {
  const outgoing = getOutgoingLocalFiles({
    collection,
    config: req.payload.config,
    current,
    nextManifest,
  })

  if (!outgoing.length || !collection.versions) {
    return
  }

  const currentWithState = synthesizeLegacyUploadState({
    collection,
    config: req.payload.config,
    doc: current,
  })
  let versions = await getVersions({ id, collection, req })

  if (!versions.length) {
    await saveVersion({
      id,
      collection,
      docWithLocales: currentWithState,
      draft: false,
      operation: 'update',
      payload: req.payload,
      req,
    })
    versions = await getVersions({ id, collection, req })
  }

  const replacements = new Map<string, string>()
  const storageBackendId = `local:${collection.slug}`

  for (const file of outgoing) {
    const identity = getManagedFileIdentity(file)
    const newestVersion = versions.find(({ version }) => {
      const stored = synthesizeLegacyUploadState({
        collection,
        config: req.payload.config,
        doc: version,
      })

      return Array.isArray(stored._managedFiles)
        ? (stored._managedFiles as ManagedFileManifest).some(
            (candidate) => getManagedFileIdentity(candidate) === identity,
          )
        : false
    })

    if (!newestVersion) {
      continue
    }

    const directory = path.posix.dirname(file.key)
    let archivedKey: string
    let suffix = 0

    while (true) {
      const archivedFilename = getArchivedFilename({
        filename: path.posix.basename(file.key),
        versionID: suffix ? `${newestVersion.id}-${suffix}` : newestVersion.id,
      })
      archivedKey = directory === '.' ? archivedFilename : `${directory}/${archivedFilename}`

      try {
        await copyLocalFile({
          from: file.key,
          staticDir: collection.upload.staticDir!,
          to: archivedKey,
        })
        break
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw err
        }
        suffix += 1
      }
    }
    trackStagedObject({
      key: archivedKey,
      remove: () => fs.rm(path.join(collection.upload.staticDir!, archivedKey), { force: true }),
      storageBackendId,
    })
    replacements.set(identity, archivedKey)
  }

  for (const row of versions) {
    const stored = synthesizeLegacyUploadState({
      collection,
      config: req.payload.config,
      doc: row.version,
    })
    const version = archiveVersionReferences({ replacements, version: stored })

    if (!version) {
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
}

const getOutgoingLocalFiles = ({
  collection,
  config,
  current,
  nextManifest,
}: {
  collection: SanitizedCollectionConfig
  config: Pick<Config, 'routes' | 'serverURL'>
  current: JsonObject
  nextManifest: ManagedFileManifest
}): ManagedFileManifest => {
  const currentWithState = synthesizeLegacyUploadState({ collection, config, doc: current })
  const currentManifest = Array.isArray(currentWithState._managedFiles)
    ? (currentWithState._managedFiles as ManagedFileManifest)
    : []
  const nextIdentities = new Set(nextManifest.map(getManagedFileIdentity))
  const storageBackendId = `local:${collection.slug}`

  return currentManifest.filter(
    (file) =>
      file.storageBackendId === storageBackendId &&
      !nextIdentities.has(getManagedFileIdentity(file)),
  )
}

const getVersions = async ({
  id,
  collection,
  req,
}: {
  collection: SanitizedCollectionConfig
  id: number | string
  req: PayloadRequest
}): Promise<VersionRow[]> => {
  const { docs } = await req.payload.db.findVersions<JsonObject>({
    collection: collection.slug,
    limit: 0,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { parent: { equals: id } },
  })

  return docs as VersionRow[]
}

const archiveVersionReferences = ({
  replacements,
  version,
}: {
  replacements: Map<string, string>
  version: JsonObject
}): JsonObject | undefined => {
  if (!Array.isArray(version._managedFiles)) {
    return
  }

  const archived = structuredClone(version)
  const manifest = archived._managedFiles as ManagedFileManifest
  let hasChanged = false

  for (const file of manifest) {
    const archivedKey = replacements.get(getManagedFileIdentity(file))

    if (!archivedKey) {
      continue
    }

    const previousFilename = path.posix.basename(file.key)
    const archivedFilename = path.posix.basename(archivedKey)

    for (const role of file.roles) {
      if (role.type === 'thumbnail') {
        archived.thumbnailURL = replaceURLFilename({
          filename: archivedFilename,
          previousFilename,
          url: archived.thumbnailURL,
        })
        continue
      }

      let stored: JsonObject | undefined
      switch (role.type) {
        case 'default':
          stored = archived
          break
        case 'original':
          stored = archived.original as JsonObject | undefined
          break
        case 'size':
          stored = (archived.sizes as Record<string, JsonObject> | undefined)?.[role.sizeKey]
          break
      }

      if (stored?.filename === previousFilename) {
        stored.filename = archivedFilename
        stored.url = replaceURLFilename({
          filename: archivedFilename,
          previousFilename,
          url: stored.url,
        })
      }
    }

    file.key = archivedKey
    hasChanged = true
  }

  return hasChanged ? archived : undefined
}

const replaceURLFilename = ({
  filename,
  previousFilename,
  url,
}: {
  filename: string
  previousFilename: string
  url: unknown
}): unknown => {
  if (typeof url !== 'string') {
    return url
  }

  const previous = encodeURIComponent(previousFilename)
  const index = url.lastIndexOf(`/${previous}`)

  return index < 0
    ? url
    : `${url.slice(0, index + 1)}${encodeURIComponent(filename)}${url.slice(index + 1 + previous.length)}`
}
