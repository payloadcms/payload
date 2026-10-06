import fs from 'node:fs/promises'
import path from 'node:path'

import type { JsonObject, PayloadRequest } from '../../types/index.js'
import type { StagedObject } from '../../uploads/fileVersioning/fileOperationManager.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { replaceStoredFileReferences } from '../../uploads/fileVersioning/archive.js'
import {
  removeUnreferencedStagedObjects,
  scheduleUnreferencedFileCleanup,
} from '../../uploads/fileVersioning/cleanup.js'
import {
  abortFileOperationScope,
  beginFileOperationScope,
  completeFileOperationScope,
  runFileOperationPlan,
} from '../../uploads/fileVersioning/fileOperationManager.js'
import { copyLocalFile, moveLocalFile } from '../../uploads/fileVersioning/localStorage.js'
import { getOriginalFilename, normalizeStorageKey } from '../../uploads/fileVersioning/naming.js'
import {
  collectStoredFiles,
  getStoredFileIdentity,
  withLegacyCloudUploadFileData,
} from '../../uploads/fileVersioning/storedFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasActiveTransaction, initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { updateDocument } from './utilities/update.js'

export type RenameFileArguments = {
  collection: Collection
  depth?: number
  disableTransaction?: boolean
  draft?: boolean
  filename: string
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
}

/** Renames the current managed file set without changing its bytes. */
export const renameFileOperation = async (
  incomingArgs: RenameFileArguments,
): Promise<JsonObject> => {
  let args = { ...incomingArgs, data: { filename: incomingArgs.filename } }
  const { req } = args
  beginFileOperationScope({ req })

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(req))
    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'updateByID',
      overrideAccess: args.overrideAccess ?? false,
    })

    const { id, collection, draft = false, overrideAccess = false } = args
    const { filename } = args.data
    if (!collection.config.upload) {
      throw new APIError('This collection does not support file rename.', 400)
    }

    const access = overrideAccess
      ? true
      : await executeAccess(
          { id, slug: collection.config.slug, data: { filename }, req },
          collection.config.access.update,
        )
    const where = combineQueries({ id: { equals: id } }, access)
    const query = { collection: collection.config.slug, locale: 'all' as const, req, where }
    const current = draft
      ? await getLatestCollectionVersion({
          id,
          config: collection.config,
          payload: req.payload,
          query,
          req,
        })
      : await req.payload.db.findOne(query)

    if (!current) {
      throw hasWhereAccessResult(access) ? new Forbidden(req.t) : new NotFound(req.t)
    }
    const stored = await withLegacyCloudUploadFileData({
      collection: collection.config,
      doc: current as JsonObject,
      req,
    })
    const operations = collection.config.upload.fileOperations
    const storedFiles = collectStoredFiles({ collection: collection.config, doc: stored, req })
    const oldOriginal = (stored.original as { filename?: string } | undefined)?.filename
    const oldFilename = oldOriginal ?? (stored.filename as string | undefined)

    if (!oldFilename || !storedFiles.length) {
      throw new APIError('This upload has no managed files to rename.', 400)
    }

    const { newStem } = validateRename({ filename, oldFilename })
    const originalStem = path.posix.parse(oldFilename).name
    const originalMarkerIndex = originalStem.lastIndexOf('-original')
    const oldStem =
      originalMarkerIndex > 0
        ? originalStem.slice(0, originalMarkerIndex)
        : path.posix.parse(stored.filename as string).name
    if (filename === `${oldStem}${path.posix.extname(oldFilename)}`) {
      throw new APIError('The upload already has this filename.', 400)
    }

    const originalFilename = getOriginalFilename({ filename })
    const plannedKeys = new Set(
      storedFiles
        .filter(({ roles }) => roles.some(({ type }) => type === 'original'))
        .map(({ key }) =>
          getStoredFileIdentity({
            key: path.posix.join(path.posix.dirname(key), originalFilename),
          }),
        ),
    )
    const replacements = new Map<string, string>()
    for (const file of storedFiles) {
      const previousFilename = path.posix.basename(file.key)
      const hasOriginalRole = file.roles.some(({ type }) => type === 'original')
      const suffix = previousFilename.startsWith(oldStem)
        ? previousFilename.slice(oldStem.length)
        : `-${previousFilename}`
      let nextFilename = hasOriginalRole ? originalFilename : `${newStem}${suffix}`
      const directory = path.posix.dirname(file.key)
      let nextKey = path.posix.join(directory, nextFilename)
      let nextIdentity = getStoredFileIdentity({
        key: nextKey,
      })
      const extension = path.posix.extname(nextFilename)
      const stem = nextFilename.slice(0, -extension.length || undefined)
      let collisionNumber = 1
      while (!hasOriginalRole && plannedKeys.has(nextIdentity)) {
        nextFilename = `${stem}-${collisionNumber}${extension}`
        nextKey = path.posix.join(directory, nextFilename)
        nextIdentity = getStoredFileIdentity({
          key: nextKey,
        })
        collisionNumber++
      }
      plannedKeys.add(nextIdentity)
      const key = normalizeStorageKey({ key: nextKey })
      replacements.set(getStoredFileIdentity(file), key)
    }

    const renamed = replaceStoredFileReferences({
      files: storedFiles,
      replacements,
      version: stored,
    })
    if (!renamed) {
      throw new APIError('The upload has no files to rename.', 400)
    }

    const staticDir = collection.config.upload.staticDir
    const hasTransaction = await hasActiveTransaction({ req })
    const hasNativeMove =
      !collection.config.versions &&
      hasTransaction &&
      (operations ? Boolean(operations.move) : Boolean(staticDir))
    const moveFiles = async ({
      trackStagedObject,
    }: {
      trackStagedObject: (object: StagedObject) => void
    }) => {
      for (const file of storedFiles) {
        const to = replacements.get(getStoredFileIdentity(file))!
        try {
          if (!operations && staticDir) {
            await moveLocalFile({ from: file.key, staticDir, to })
            trackStagedObject({
              key: to,
              remove: () => moveLocalFile({ from: to, staticDir, to: file.key }),
            })
          } else if (operations?.move) {
            await operations.move({ from: file.key, req, to, trackStagedObject })
          }
        } catch (err) {
          if (isStorageCollision({ err })) {
            throw new APIError(`A file named ${path.posix.basename(to)} already exists.`, 409)
          }
          throw err
        }
      }
    }
    const result = await runFileOperationPlan({
      cleanupStagedAfterWriteFailure: (objects) =>
        removeUnreferencedStagedObjects({ collection: collection.config, objects, req }),
      req,
      stage: async ({ trackStagedObject }) => {
        if (hasNativeMove) {
          return
        }
        for (const file of storedFiles) {
          const to = replacements.get(getStoredFileIdentity(file))!
          if (!operations && staticDir) {
            try {
              await copyLocalFile({ from: file.key, staticDir, to })
            } catch (err) {
              if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
                throw new APIError(`A file named ${path.posix.basename(to)} already exists.`, 409)
              }
              throw err
            }
            trackStagedObject({
              key: to,
              remove: () => fs.rm(path.join(staticDir, to), { force: true }),
            })
          } else if (operations?.copy) {
            // The old key may still belong to a version, so even an adapter with move uses copy here.
            try {
              await operations.copy({ from: file.key, req, to, trackStagedObject })
            } catch (err) {
              if (isStorageCollision({ err })) {
                throw new APIError(`A file named ${path.posix.basename(to)} already exists.`, 409)
              }
              throw err
            }
          } else {
            throw new APIError('No safe copy operation is available for this upload.', 400)
          }
        }
      },
      write: async ({ trackStagedObject }) => {
        if (hasNativeMove) {
          await moveFiles({ trackStagedObject })
        }
        if (collection.config.versions) {
          const previousVersions = await req.payload.db.findVersions({
            collection: collection.config.slug,
            limit: 1,
            req,
            where: { parent: { equals: id } },
          })

          if (!previousVersions.docs.length) {
            await saveVersion({
              id,
              collection: collection.config,
              docWithLocales: stored,
              draft: false,
              operation: 'update',
              payload: req.payload,
              req,
            })
          }
        }

        const data = { ...renamed }
        delete data.id
        delete data.createdAt
        delete data.updatedAt
        if (draft) {
          data._status = 'draft'
        }
        const updated = await updateDocument({
          id,
          autosave: false,
          collectionConfig: collection.config,
          config: req.payload.config,
          data: data as never,
          depth: args.depth ?? 0,
          docWithLocales: stored as never,
          draftArg: draft,
          fallbackLocale: req.fallbackLocale!,
          filesToUpload: [],
          locale: req.locale!,
          overrideAccess,
          overrideLock: false,
          payload: req.payload,
          req,
          select: undefined!,
          showHiddenFields: false,
        })

        if (!hasNativeMove) {
          await scheduleUnreferencedFileCleanup({
            candidates: storedFiles,
            collection: collection.config,
            req,
          })
        }
        return updated as JsonObject
      },
    })

    const finalResult = await buildAfterOperation({
      args,
      collection: collection.config,
      operation: 'updateByID',
      overrideAccess,
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }
    await completeFileOperationScope({ req })
    return finalResult as JsonObject
  } catch (err) {
    await killTransaction(req)
    await abortFileOperationScope({ req })
    throw err
  }
}

const validateRename = ({ filename, oldFilename }: { filename: string; oldFilename: string }) => {
  if (
    typeof filename !== 'string' ||
    !filename ||
    filename === '.' ||
    filename === '..' ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('\0')
  ) {
    throw new APIError('Invalid filename.', 400)
  }

  const oldExtension = path.posix.extname(oldFilename)
  const newExtension = path.posix.extname(filename)
  if (oldExtension.toLowerCase() !== newExtension.toLowerCase()) {
    throw new APIError('The new filename must keep the original file extension.', 400)
  }

  return {
    newStem: filename.slice(0, -newExtension.length || undefined),
  }
}

const isStorageCollision = ({ err }: { err: unknown }): boolean => {
  if (!err || typeof err !== 'object') {
    return false
  }

  const { code, message, statusCode } = err as {
    code?: number | string
    message?: string
    statusCode?: number
  }

  return (
    code === 'EEXIST' ||
    code === 'PreconditionFailed' ||
    code === 412 ||
    statusCode === 409 ||
    statusCode === 412 ||
    Boolean(message?.includes('Storage destination already exists'))
  )
}
