import type { TFunction } from 'i18next'

import type { Payload } from '../payload'
import type { FileToSave } from './types'

import { FileUploadError } from '../errors'
import saveBufferToFile from './saveBufferToFile'

export const uploadFiles = async (
  payload: Payload,
  files: FileToSave[],
  t: TFunction,
): Promise<void> => {
  try {
    await Promise.all(
      files.map(async ({ buffer, path }) => {
        await saveBufferToFile(buffer, path)
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(t)
  }
}
