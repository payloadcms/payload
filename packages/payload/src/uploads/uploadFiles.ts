import fs from 'fs/promises'

import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileToSave } from './types.js'

import { FileUploadError } from '../errors/index.js'
import { saveBufferToFile } from './saveBufferToFile.js'

export const uploadFiles = async (
  payload: Payload,
  files: FileToSave[],
  req: PayloadRequest,
): Promise<void> => {
  try {
    await Promise.all(
      files.map(async (file) => {
        if ('sourcePath' in file) {
          await fs.copyFile(file.sourcePath, file.path)
        } else {
          await saveBufferToFile(file.buffer, file.path)
        }
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
