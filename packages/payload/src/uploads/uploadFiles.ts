import type { PayloadT } from '..'
import type { PayloadRequest } from '../exports/types'
import type { FileToSave } from './types'

import { FileUploadError } from '../errors'
import saveBufferToFile from './saveBufferToFile'

export const uploadFiles = async (
  payload: PayloadT,
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
