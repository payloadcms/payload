import type { Payload } from '../index.d.ts'
import type { PayloadRequest } from '../types/index.d.ts'
import type { FileToSave } from './types.d.ts'

import { FileUploadError } from '../errors/index.js'
import saveBufferToFile from './saveBufferToFile.js'

export const uploadFiles = async (
  payload: Payload,
  files: FileToSave[],
  req: PayloadRequest,
): Promise<void> => {
  try {
    await Promise.all(
      files.map(async ({ buffer, path }) => {
        await saveBufferToFile(buffer, path)
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
