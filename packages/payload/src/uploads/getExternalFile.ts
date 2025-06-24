import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { isURLAllowed } from '../utilities/isURLAllowed.js'
import { safeFetch } from './safeFetch.js'

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

    const headers = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
      : { cookie: req.headers.get('cookie')! }

    /**
     * `fetch` on the `allowList` in the the upload config.`
     * Otherwise `safeFetch`
     * Config example 
     * 
     * Allowlist format:
     * ```ts
     * Array<{
          hostname: string
          pathname?: string
          port?: string
          protocol?: 'http' | 'https'
          search?: string
        }>
     *```
     
     * Config example:
     * ```ts
     * upload: {
        pasteURL: {
          allowList: [
            // Allow a specific URL
            { protocol: 'https', hostname: 'example.com', port: '', search: '' },
            // Allow a specific URL with a port
            { protocol: 'http', hostname: '127.0.0.1', port: '3000', search: '' },
            // Allow a local address
            { protocol: 'http', hostname: 'localhost', port: '3000', search: '' },
          ],
        },
       ```
     */
    const allowList = uploadConfig.pasteURL ? uploadConfig.pasteURL.allowList : []
    let res
    if (allowList.length > 0 && isURLAllowed(fileURL, allowList)) {
      // Allowed
      res = await fetch(fileURL, {
        credentials: 'include',
        headers,
        method: 'GET',
      })
    } else {
      // Default
      res = await safeFetch(fileURL, {
        credentials: 'include',
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
  }

  throw new APIError('Invalid file url', 400)
}
