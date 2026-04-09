import type { PayloadRequest } from 'payload'
import type { UTApi } from 'uploadthing/server'

import { APIError } from 'payload'

import { getKeyFromFilename } from './utilities.js'

interface DeleteFileArgs {
  doc: Record<string, unknown>
  filename: string
  req: PayloadRequest
  utApi: UTApi
}

export async function deleteFile({ doc, filename, req, utApi }: DeleteFileArgs): Promise<void> {
  const key = getKeyFromFilename(doc, filename)

  if (!key) {
    req.payload.logger.error({
      msg: `Error deleting file: ${filename} - unable to extract key from doc`,
    })
    throw new APIError(`Error deleting file: ${filename}`)
  }

  try {
    await utApi.deleteFiles(key)
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `Error deleting file with key: ${filename} - key: ${key}`,
    })
    throw new APIError(`Error deleting file: ${filename}`)
  }
}
