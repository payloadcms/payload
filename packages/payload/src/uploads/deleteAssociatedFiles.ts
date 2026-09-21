import fs from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileData, FileToSave } from './types.js'

import { APIError, ErrorDeletingFile } from '../errors/index.js'
import { fileExists } from './fileExists.js'

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
  if (overrideDelete || files.length > 0) {
    const { staticDir: staticPath } = collectionConfig.upload

    const fileToDelete = resolveFilePath({
      filename: doc.filename as string,
      staticPath,
    })

    try {
      await deleteFile({ filePath: fileToDelete, staticPath })
    } catch (ignore) {
      throw new ErrorDeletingFile(req.t)
    }

    if (doc.sizes) {
      const sizes: FileData[] = Object.values(doc.sizes)
      // Since forEach will not wait until unlink is finished it could
      // happen that two operations will try to delete the same file.
      // To avoid this it is recommended to use "sync" instead

      for (const size of sizes) {
        const sizeToDelete = resolveFilePath({ filename: size.filename, staticPath })
        try {
          await deleteFile({ filePath: sizeToDelete, staticPath })
        } catch (ignore) {
          throw new ErrorDeletingFile(req.t)
        }
      }
    }
  }
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

const deleteFile = async ({ filePath, staticPath }: { filePath?: string; staticPath?: string }) => {
  if (!filePath || !staticPath) {
    return
  }

  if (!(await fileExists(filePath))) {
    return
  }

  const [resolvedDir, resolvedParent] = await Promise.all([
    fs.realpath(staticPath),
    fs.realpath(path.dirname(filePath)),
  ])
  const resolvedTarget = path.join(resolvedParent, path.basename(filePath))

  if (!isWithinDirectory({ directory: resolvedDir, target: resolvedTarget })) {
    throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
  }

  await fs.unlink(filePath)
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
