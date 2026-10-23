import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileContentToSave } from './fileContent.js'
import type { FileToSave } from './types.js'

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
              ? ({ type: 'file', ownership: 'external', path: file.sourcePath } as const)
              : ({ type: 'buffer', buffer: file.buffer } as const)

        await saveFileContent(content, file.path)
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
