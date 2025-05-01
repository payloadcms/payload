import fs from 'fs/promises'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileData, FileToSave } from './types.js'

import { ErrorDeletingFile } from '../errors/index.js'
import fileExists from './fileExists.js'

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

    const fileToDelete = `${staticPath}/${doc.filename as string}`

    try {
      if (await fileExists(fileToDelete)) {
        await fs.unlink(fileToDelete)
      }
    } catch (err) {
      throw new ErrorDeletingFile(req.t)
    }

    if (doc.sizes) {
      const sizes: FileData[] = Object.values(doc.sizes)
      // Since forEach will not wait until unlink is finished it could
      // happen that two operations will try to delete the same file.
      // To avoid this it is recommended to use "sync" instead

      for (const size of sizes) {
        const sizeToDelete = `${staticPath}/${size.filename}`
        try {
          if (await fileExists(sizeToDelete)) {
            await fs.unlink(sizeToDelete)
          }
        } catch (err) {
          throw new ErrorDeletingFile(req.t)
        }
      }
    }
  }
}
