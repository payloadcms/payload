import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import type { PayloadRequest } from '../types/index.js'

import { fetchFullClientUpload } from './getFileFromUploadInstructions.js'

type UploadFile = NonNullable<PayloadRequest['file']>

/**
 * For an operation that applies one client upload to many documents, such as a bulk update.
 * Each document decides on its own whether a transformer needs the whole file, but the first
 * document that does downloads it for all of them. Each document gets its own copy of the
 * downloaded temp file, because processing a document can change or remove its file.
 */
export const createSharedClientUploadDownload = (): {
  fetchFullUpload: typeof fetchFullClientUpload
  removeSharedDownload: () => Promise<void>
} => {
  let sharedDownload: Promise<UploadFile> | undefined

  return {
    fetchFullUpload: async (args) => {
      sharedDownload ??= fetchFullClientUpload(args)
      const downloadedFile = await sharedDownload

      if (!downloadedFile.tempFilePath) {
        return downloadedFile
      }

      const extension = path.extname(downloadedFile.tempFilePath)
      const documentTempFilePath = path.join(
        path.dirname(downloadedFile.tempFilePath),
        `${path.basename(downloadedFile.tempFilePath, extension)}-${randomUUID()}${extension}`,
      )
      await fs.copyFile(downloadedFile.tempFilePath, documentTempFilePath)

      return { ...downloadedFile, tempFilePath: documentTempFilePath }
    },
    removeSharedDownload: async () => {
      const downloadedFile = await sharedDownload?.catch(() => undefined)

      if (downloadedFile?.tempFilePath) {
        await fs.rm(downloadedFile.tempFilePath, { force: true })
      }
    },
  }
}
