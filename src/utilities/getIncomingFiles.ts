import type { FileData } from 'payload/dist/uploads/types'
import type { PayloadRequest } from 'payload/types'
import type { File } from '../types'

export function getIncomingFiles({
  req,
  data,
}: {
  data: Partial<FileData>
  req: PayloadRequest
}): File[] {
  const file = req.files?.file

  let files: File[] = []

  if (file && data.filename && data.mimeType) {
    const mainFile: File = {
      filename: data.filename,
      mimeType: data.mimeType,
      buffer: file.data,
      tempFilePath: file.tempFilePath,
      filesize: file.size,
    }

    files = [mainFile]

    if (data?.sizes) {
      Object.entries(data.sizes).forEach(([key, resizedFileData]) => {
        if (req.payloadUploadSizes?.[key] && data.mimeType) {
          files = files.concat([
            {
              filename: `${resizedFileData.filename}`,
              mimeType: data.mimeType,
              buffer: req.payloadUploadSizes[key],
              filesize: req.payloadUploadSizes[key].length,
            },
          ])
        }
      })
    }
  }

  return files
}
