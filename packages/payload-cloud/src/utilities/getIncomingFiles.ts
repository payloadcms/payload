import type { FileData, PayloadRequest } from 'payload'

import { getStoredUploadVariants } from 'payload'

import type { File } from '../types.js'

export function getIncomingFiles({
  data,
  req,
}: {
  data: Partial<FileData>
  req: PayloadRequest
}): File[] {
  const file = req.file

  let files: File[] = []

  if (file && data.filename && data.mimeType) {
    const mainFile: File = {
      buffer: file.data,
      filename: data.filename,
      filesize: file.size,
      mimeType: data.mimeType,
      tempFilePath: file.tempFilePath,
    }

    files = [mainFile]

    const variants = getStoredUploadVariants({ config: req.payload.config, doc: data })

    if (variants) {
      Object.entries(variants).forEach(([key, resizedFileData]) => {
        if (req.payloadUploadSizes?.[key] && resizedFileData.mimeType) {
          files = files.concat([
            {
              buffer: req.payloadUploadSizes[key],
              filename: `${resizedFileData.filename}`,
              filesize: req.payloadUploadSizes[key].length,
              mimeType: resizedFileData.mimeType,
            },
          ])
        }
      })
    }
  }

  return files
}
