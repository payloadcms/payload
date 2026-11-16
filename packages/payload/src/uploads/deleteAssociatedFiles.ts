import fs from 'fs/promises'
import path from 'path'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileData, FileToSave } from './types.js'

import { ErrorDeletingFile } from '../errors/index.js'
import { fileExists } from './fileExists.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  doc: Record<string, unknown>
  files?: FileToSave[]
  overrideDelete: boolean
  req: PayloadRequest
}

const isPathWithin = (parentPath: string, targetPath: string): boolean => {
  const relativePath = path.relative(parentPath, targetPath)

  return (
    relativePath === '' ||
    (!path.isAbsolute(relativePath) &&
      relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`))
  )
}

const deleteFile = async ({ filename, staticPath }: { filename?: string; staticPath?: string }) => {
  if (!filename || !staticPath) {
    return
  }

  const resolvedStaticPath = path.resolve(staticPath)
  const filePath = path.resolve(resolvedStaticPath, filename)

  if (!isPathWithin(resolvedStaticPath, filePath)) {
    throw new Error('Invalid filename')
  }

  if (await fileExists(filePath)) {
    const [canonicalParentPath, canonicalStaticPath] = await Promise.all([
      fs.realpath(path.dirname(filePath)),
      fs.realpath(resolvedStaticPath),
    ])

    if (!isPathWithin(canonicalStaticPath, canonicalParentPath)) {
      throw new Error('Invalid filename')
    }

    await fs.unlink(filePath)
  }
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

    try {
      await deleteFile({ filename: doc.filename as string | undefined, staticPath })
    } catch (ignore) {
      throw new ErrorDeletingFile(req.t)
    }

    if (doc.sizes) {
      const sizes: FileData[] = Object.values(doc.sizes)
      // Since forEach will not wait until unlink is finished it could
      // happen that two operations will try to delete the same file.
      // To avoid this it is recommended to use "sync" instead

      for (const size of sizes) {
        try {
          await deleteFile({ filename: size.filename, staticPath })
        } catch (ignore) {
          throw new ErrorDeletingFile(req.t)
        }
      }
    }
  }
}
