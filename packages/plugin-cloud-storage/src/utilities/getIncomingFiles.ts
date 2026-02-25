import type { FileData, PayloadRequest } from 'payload'

import type { File } from '../types.js'

interface CloudStorageContext {
  file: PayloadRequest['file']
  uploadSizes: PayloadRequest['payloadUploadSizes']
}

export function getIncomingFiles({
  data,
  req,
}: {
  data: Partial<FileData>
  req: PayloadRequest
}): File[] {
  // Fall back to context if req.file was cleared
  const ctx = req.context?._payloadCloudStorage as CloudStorageContext | undefined
  const file = req.file ?? ctx?.file
  const payloadUploadSizes = req.payloadUploadSizes ?? ctx?.uploadSizes

  let files: File[] = []

  if (file && data.filename && data.mimeType) {
    const mainFile: File = {
      buffer: file.data,
      clientUploadContext: file.clientUploadContext,
      filename: data.filename,
      filesize: file.size,
      mimeType: data.mimeType,
      tempFilePath: file.tempFilePath,
    }

    files = [mainFile]

    if (data?.sizes) {
      Object.entries(data.sizes).forEach(([key, resizedFileData]) => {
        if (payloadUploadSizes?.[key] && resizedFileData.mimeType) {
          files = files.concat([
            {
              buffer: payloadUploadSizes[key],
              filename: `${resizedFileData.filename}`,
              filesize: payloadUploadSizes[key].length,
              mimeType: resizedFileData.mimeType,
            },
          ])
        }
      })
    }
  }

  return files
}
