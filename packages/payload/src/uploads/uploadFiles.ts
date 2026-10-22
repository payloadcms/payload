import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileToSave } from './types.js'
import type { FileContentToSave } from './fileContent.js'

import { FileUploadError } from '../errors/index.js'
import { saveFileContent } from './fileContent.js'

export const uploadFiles = async (
  payload: Payload,
  files: (FileContentToSave | FileToSave)[],
  req: PayloadRequest,
): Promise<void> => {
  try {
    await Promise.all(
      files.map(async (file) => {
        const content =
          'content' in file
            ? file.content
            : 'sourcePath' in file
              ? ({ ownership: 'external', path: file.sourcePath, type: 'file' } as const)
              : ({ buffer: file.buffer, type: 'buffer' } as const)

        await saveFileContent(content, file.path)
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
