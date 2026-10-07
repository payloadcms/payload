import fs from 'node:fs/promises'
import path from 'node:path'

import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'
import type { StagedObject } from './fileOperationManager.js'
import type { StoredFileList } from './types.js'

import { saveVersion } from '../../versions/saveVersion.js'
import { removeUnreferencedStagedObjects, scheduleUnreferencedFileCleanup } from './cleanup.js'
import { runFileOperationPlan, stageLocalUploadFiles } from './fileOperationManager.js'
import { copyLocalFile } from './localStorage.js'
import { getArchivedFilename } from './naming.js'
import {
  collectStoredFiles,
  getStoredFileIdentity,
  withLegacyUploadFileData,
} from './storedFiles.js'

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
  next,
  req,
  write,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  files: FileToSave[]
  id: number | string
  next: JsonObject
  req: PayloadRequest
  write: () => Promise<T>
}): Promise<T> => {
  const nextDoc = { ...current, ...next }

  if (
    !hasLocalFileChange({
      collection,
      config: req.payload.config,
      current,
      hasNewFiles: files.length > 0,
      next: nextDoc,
      req,
    })
  ) {
    return write()
  }

  return runFileOperationPlan({
    cleanupStagedAfterWriteFailure: (objects) =>
      removeUnreferencedStagedObjects({ collection, objects, req }),
    req,
    stage: ({ trackStagedObject }) =>
      stageLocalUploadFiles({
        files,
        staticDir: collection.upload.staticDir!,
        trackStagedObject,
      }),
    write: async ({ trackStagedObject }) => {
      await archiveOutgoingLocalFiles({
        id,
        collection,
        current,
        next: nextDoc,
        req,
        trackStagedObject,
      })

      const result = await write()

      await scheduleUnreferencedFileCleanup({
        candidates: getOutgoingLocalFiles({
          collection,
          config: req.payload.config,
          current,
          next: nextDoc,
          req,
        }),
        collection,
        req,
      })

      return result
    },
  })
}

/** Also detects removals, which have no new upload to stage. */
const hasLocalFileChange = ({
  collection,
  config,
  current,
  hasNewFiles,
  next,
  req,
}: {
  collection: SanitizedCollectionConfig
  config: Pick<Config, 'routes' | 'serverURL'>
  current: JsonObject
  hasNewFiles: boolean
  next: JsonObject
  req: PayloadRequest
}): boolean =>
  !collection.upload.disableLocalStorage &&
  (hasNewFiles ||
    getOutgoingLocalFiles({
      collection,
      config,
      current,
      next,
      req,
    }).length > 0)

/** Preserves outgoing local objects and repairs every retained version that referenced them. */
export const archiveOutgoingLocalFiles = async ({
  id,
  collection,
  current,
  next,
  req,
  trackStagedObject,
}: {
  collection: SanitizedCollectionConfig
  current: JsonObject
  id: number | string
  next: JsonObject
  req: PayloadRequest
  trackStagedObject: (object: StagedObject) => void
}): Promise<void> => {
  const outgoing = getOutgoingLocalFiles({
    collection,
    config: req.payload.config,
    current,
    next,
    req,
  })

  if (!outgoing.length || !collection.versions) {
    return
  }

  const currentWithState = withLegacyUploadFileData({
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
  for (const file of outgoing) {
    const identity = getStoredFileIdentity(file)
    const newestVersion = versions.find(({ version }) => {
      const stored = withLegacyUploadFileData({
        collection,
        config: req.payload.config,
        doc: version,
      })

      return collectStoredFiles({ collection, doc: stored, req }).some(
        (candidate) => getStoredFileIdentity(candidate) === identity,
      )
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
    })
    replacements.set(identity, archivedKey)
  }

  for (const row of versions) {
    const stored = withLegacyUploadFileData({
      collection,
      config: req.payload.config,
      doc: row.version,
    })
    const version = replaceStoredFileReferences({
      files: collectStoredFiles({ collection, doc: stored, req }),
      replacements,
      version: stored,
    })

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
  next,
  req,
}: {
  collection: SanitizedCollectionConfig
  config: Pick<Config, 'routes' | 'serverURL'>
  current: JsonObject
  next: JsonObject
  req: PayloadRequest
}): StoredFileList => {
  const currentWithState = withLegacyUploadFileData({ collection, config, doc: current })
  const currentFiles = collectStoredFiles({ collection, doc: currentWithState, req })
  const nextFiles = collectStoredFiles({ collection, doc: next, req, trustGenerated: true })
  const nextIdentities = new Set(nextFiles.map(getStoredFileIdentity))
  return currentFiles.filter((file) => !nextIdentities.has(getStoredFileIdentity(file)))
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

export const replaceStoredFileReferences = ({
  files,
  replacements,
  version,
}: {
  files: StoredFileList
  replacements: Map<string, string>
  version: JsonObject
}): JsonObject | undefined => {
  if (!files.length) {
    return
  }

  const archived = structuredClone(version)
  let hasChanged = false

  for (const file of files) {
    const archivedKey = replacements.get(getStoredFileIdentity(file))

    if (!archivedKey) {
      continue
    }

    const archivedFilename = path.posix.basename(archivedKey)

    for (const role of file.roles) {
      let stored: JsonObject | undefined
      switch (role.type) {
        case 'default':
          stored = archived
          break
        case 'original':
          stored = archived.original as JsonObject | undefined
          break
        case 'size':
          stored = (archived.variants as Record<string, JsonObject> | undefined)?.[role.sizeKey]
          break
      }

      if (typeof stored?.filename === 'string') {
        const previousFilename = stored.filename
        const directory = path.posix.dirname(previousFilename)
        const filename = directory === '.' ? archivedFilename : `${directory}/${archivedFilename}`
        stored.filename = filename
        stored.url = replaceURLFilename({
          filename,
          previousFilename,
          url: stored.url,
        })
        hasChanged = true
      }
    }
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
