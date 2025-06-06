import { ofetch } from 'ofetch'

import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { dispatcher } from './safeRequest.js'

type Args = {
  data: FileData
  req: PayloadRequest
  uploadConfig: UploadConfig
}
export const getExternalFile = async ({ data, req, uploadConfig }: Args): Promise<File> => {
  const { filename, url } = data

  if (typeof url === 'string') {
    let fileURL = url
    if (!url.startsWith('http')) {
      const baseUrl = req.headers.get('origin') || `${req.protocol}://${req.headers.get('host')}`
      fileURL = `${baseUrl}${url}`
    }

    let res
    try {
      const headers = uploadConfig.externalFileHeaderFilter
        ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
        : { cookie: req.headers.get('cookie')! }
      const fetchOptions: RequestInit = {
        credentials: 'include',
        headers,
        method: 'GET',
      }
      const allowList = uploadConfig.pasteURL ? uploadConfig.pasteURL.allowList : []

      // Use native Fetch if allowList is populated
      if (allowList.length) {
        res = await fetch(fileURL, fetchOptions)
      } else {
        // Use ofetch with custom dispatcher for safety
        const safeOfetch = ofetch.create({
          dispatcher,
        })
        res = await safeOfetch(fileURL, fetchOptions)
      }
    } catch (error) {
      // Retrieve nested error from dispatcher if available
      // @ts-ignore - The expected error is nested
      if (error && error?.cause && error.cause?.cause) {
        // @ts-ignore - The expected error is nested
        throw new APIError(error.cause.cause.message, 500, error.cause.cause)
      } else {
        // @ts-ignore - The expected error is nested
        throw new APIError(`Failed to fetch file from ${fileURL}`, error.statusCode, error)
      }
    }

    if (!res.ok) {
      throw new APIError(`Failed to fetch file from ${fileURL}`, res.status)
    }

    const data = await res.arrayBuffer()

    return {
      name: filename,
      data: Buffer.from(data),
      mimetype: res.headers.get('content-type') || undefined!,
      size: Number(res.headers.get('content-length')) || 0,
    }
  }

  throw new APIError('Invalid file url', 400)
}
