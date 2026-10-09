import fs from 'fs/promises'

import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileToSave } from './types.js'
import type { UploadFileRollbacks } from './uploadFileRollback.js'

import { FileUploadError } from '../errors/index.js'
import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'
import { saveBufferToFile } from './saveBufferToFile.js'
import { publishUploadedFile, stageUploadFileRollback } from './uploadFileRollback.js'

export const uploadFiles = async (
  payload: Payload,
  files: FileToSave[],
  req: PayloadRequest,
  {
    uploadFileRollbacks,
  }: {
    uploadFileRollbacks?: UploadFileRollbacks
  } = {},
): Promise<void> => {
  assertNoValidationWrite(req)

  try {
    const filesToUpload: Array<{ file: FileToSave; stagedFile: FileToSave }> = []

    for (const file of files) {
      filesToUpload.push({
        file,
        stagedFile: uploadFileRollbacks
          ? await stageUploadFileRollback({ file, rollbacks: uploadFileRollbacks })
          : file,
      })
    }

    const uploadResults = await Promise.allSettled(
      filesToUpload.map(async ({ stagedFile }) => {
        if ('sourcePath' in stagedFile) {
          await fs.copyFile(stagedFile.sourcePath, stagedFile.path)
        } else {
          await saveBufferToFile(stagedFile.buffer, stagedFile.path)
        }
      }),
    )

    const failedUpload = uploadResults.find((result) => result.status === 'rejected')

    if (failedUpload) {
      throw failedUpload.reason
    }

    if (uploadFileRollbacks) {
      for (const { file, stagedFile } of filesToUpload) {
        await publishUploadedFile({ file, rollbacks: uploadFileRollbacks, stagedFile })
      }
    }
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
