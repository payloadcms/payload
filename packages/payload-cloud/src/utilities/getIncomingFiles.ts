import type { FileData, PayloadRequest } from 'payload'

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

    if (data?.sizes) {
      Object.entries(data.sizes).forEach(([key, resizedFileData]) => {
        if (req.payloadUploadSizes?.[key] && data.mimeType) {
          files = files.concat([
            {
              buffer: req.payloadUploadSizes[key],
              filename: `${resizedFileData.filename}`,
              filesize: req.payloadUploadSizes[key].length,
              mimeType: data.mimeType,
            },
          ])
        }
      })
    }
  }

  return files
}
