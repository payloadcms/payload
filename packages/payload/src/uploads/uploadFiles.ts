import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileSourceToSave } from './fileSource.js'
import type { FileToSave } from './types.js'

import { FileUploadError } from '../errors/index.js'
import { saveFileSource } from './fileSource.js'

export const uploadFiles = async (
  payload: Payload,
  files: (FileSourceToSave | FileToSave)[],
  req: PayloadRequest,
): Promise<void> => {
  try {
    await Promise.all(
      files.map(async (file) => {
        const source =
          'source' in file
            ? file.source
            : 'sourcePath' in file
              ? ({ type: 'file', ownership: 'external', path: file.sourcePath } as const)
              : ({ type: 'buffer', buffer: file.buffer } as const)

        await saveFileSource(source, file.path)
      }),
    )
  } catch (err) {
    payload.logger.error(err)
    throw new FileUploadError(req.t)
  }
}
