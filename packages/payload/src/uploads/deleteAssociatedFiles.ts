import fs from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileIdentity } from './fileIdentity.js'
import type { FileData, FileToSave } from './types.js'

import { APIError, ErrorDeletingFile } from '../errors/index.js'
import {
  beginDeferredCleanupScopeIfNeeded,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
  scheduleAfterTransactionCommit,
} from '../utilities/transactionCallbacks.js'
import { fileExists } from './fileExists.js'
import { getFileIdentity, hasRenameStableFileIdentity } from './fileIdentity.js'
import { discardQuarantinedFile, quarantineFile, restoreQuarantinedFile } from './fileQuarantine.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  doc: Record<string, unknown>
  files?: FileToSave[]
  overrideDelete: boolean
  req: PayloadRequest
}

export const deleteAssociatedFiles: (args: Args) => Promise<void> = async ({
  collectionConfig,
  doc,
  files = [],
  overrideDelete,
  req,
}) => {
  if (!collectionConfig.upload) {
    return
  }
  const cleanupScope = await beginDeferredCleanupScopeIfNeeded({ req })
  const replacementFilePaths = new Set(files.map((file) => path.resolve(file.path)))

  try {
    if (overrideDelete || files.length > 0) {
      const { staticDir: staticPath } = collectionConfig.upload

      const fileToDelete = resolveFilePath({
        filename: doc.filename as string,
        staticPath,
      })

      if (fileToDelete && !replacementFilePaths.has(fileToDelete)) {
        await scheduleFileDeletion({ filePath: fileToDelete, req, staticPath })
      }

      if (doc.variants) {
        const variants: FileData[] = Object.values(doc.variants)
        // Since forEach will not wait until unlink is finished it could
        // happen that two operations will try to delete the same file.
        // To avoid this it is recommended to use "sync" instead

        for (const variant of variants) {
          const variantToDelete = resolveFilePath({ filename: variant.filename, staticPath })
          if (variantToDelete && !replacementFilePaths.has(variantToDelete)) {
            await scheduleFileDeletion({ filePath: variantToDelete, req, staticPath })
          }
        }
      }
    }

    if (cleanupScope) {
      await flushDeferredCleanupScope({ req, scope: cleanupScope })
    }
  } catch (error) {
    if (cleanupScope) {
      clearDeferredCleanupScope({ req, scope: cleanupScope })
    }

    throw error
  }
}

const scheduleFileDeletion = async ({
  filePath,
  req,
  staticPath,
}: {
  filePath?: string
  req: PayloadRequest
  staticPath?: string
}): Promise<void> => {
  let isFileDeletionSafe: boolean

  try {
    isFileDeletionSafe = await assertFileDeletionIsSafe({ filePath, staticPath })
  } catch (ignore) {
    throw new ErrorDeletingFile(req.t)
  }

  if (!isFileDeletionSafe) {
    return
  }

  const fileIdentity = await getFileIdentity({ filePath: filePath! })

  if (!fileIdentity) {
    return
  }

  await scheduleAfterTransactionCommit({
    callback: async () => {
      try {
        await deleteFile({ fileIdentity, filePath, staticPath })
      } catch (ignore) {
        throw new ErrorDeletingFile(req.t)
      }
    },
    req,
  })
}

const resolveFilePath = ({
  filename,
  staticPath,
}: {
  filename?: null | string
  staticPath?: string
}) => {
  if (!filename || !staticPath) {
    return
  }

  const resolvedDir = path.resolve(staticPath)
  const filePath = path.resolve(resolvedDir, filename)

  if (!isWithinDirectory({ directory: resolvedDir, target: filePath })) {
    throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
  }

  return filePath
}

const deleteFile = async ({
  fileIdentity,
  filePath,
  staticPath,
}: {
  fileIdentity: FileIdentity
  filePath?: string
  staticPath?: string
}) => {
  if (!(await assertFileDeletionIsSafe({ filePath, staticPath }))) {
    return
  }

  const quarantinedFile = await quarantineFile({ filePath: filePath! })

  if (!quarantinedFile) {
    return
  }

  if (
    !hasRenameStableFileIdentity({ actual: quarantinedFile.fileIdentity, expected: fileIdentity })
  ) {
    await restoreQuarantinedFile({ quarantinedFile, targetFilePath: filePath! })
    return
  }

  await discardQuarantinedFile({ quarantinedFile })
}

const assertFileDeletionIsSafe = async ({
  filePath,
  staticPath,
}: {
  filePath?: string
  staticPath?: string
}): Promise<boolean> => {
  if (!filePath || !staticPath || !(await fileExists(filePath))) {
    return false
  }

  const [resolvedDir, resolvedParent] = await Promise.all([
    fs.realpath(staticPath),
    fs.realpath(path.dirname(filePath)),
  ])
  const resolvedTarget = path.join(resolvedParent, path.basename(filePath))

  if (!isWithinDirectory({ directory: resolvedDir, target: resolvedTarget })) {
    throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
  }

  return true
}

const isWithinDirectory = ({ directory, target }: { directory: string; target: string }) => {
  const relativePath = path.relative(directory, target)

  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  )
}
