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
    /**
     * A client upload is already stored under the filename it was given upload instructions for.
     * When Payload settles on a different filename - a duplicate was uniquified, or the name was
     * sanitized - the stored file no longer belongs to the document, so it has to be uploaded
     * again under the final filename. The originally stored file is left alone - another document
     * may have been saved with that filename in the meantime.
     */
    const isStoredUnderFinalFilename = Boolean(file.uploadReference) && file.name === data.filename

    const mainFile: File = {
      buffer: file.data,
      filename: data.filename,
      filesize: file.size,
      mimeType: data.mimeType,
      tempFilePath: file.tempFilePath,
      uploadReference: isStoredUnderFinalFilename ? file.uploadReference : undefined,
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
