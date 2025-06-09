import type { Response as NodeFetchResponse } from 'node-fetch'

import { default as nodeFetch } from 'node-fetch'
// @ts-ignore - ssrf-req-filter is not typed
import ssrfFilter from 'ssrf-req-filter'

import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'

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

    let res: NodeFetchResponse | Response
    try {
      const headers = uploadConfig.externalFileHeaderFilter
        ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
        : { cookie: req.headers.get('cookie')! }
      const allowList = uploadConfig.pasteURL && uploadConfig.pasteURL.allowList

      if (allowList) {
        res = await fetch(fileURL, {
          credentials: 'include',
          headers,
          method: 'GET',
        })
      } else {
        res = await nodeFetch(url, {
          agent: ssrfFilter(url),
          headers,
          method: 'GET',
        })
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.startsWith('Call to') && error.message.endsWith('is blocked.')) {
          throw new APIError(
            `Failed to fetch file from unsafe url, ${fileURL}. ${error.message}`,
            400,
          )
        } else {
          throw new APIError(`Failed to fetch file from ${fileURL}, ${error.message}`, 500)
        }
      }
    }
  }

  throw new APIError('Invalid file url', 400)
}
