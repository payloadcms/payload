import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { fetchWithRedirects } from './fetchWithRedirects.js'

type Args = {
  data: Pick<FileData, 'filename' | 'url'>
  req: PayloadRequest
  uploadConfig: UploadConfig
}
/** Downloads a file into a Payload File buffer, including existing files being resized or copied. */
export const downloadFileToBuffer = async ({ data, req, uploadConfig }: Args): Promise<File> => {
  const { filename, url } = data

  let trimAuthCookies = true
  if (typeof url === 'string') {
    let fileURL = url
    if (!url.startsWith('http')) {
      // URL points to the same server - we can send any cookies safely to our server.
      trimAuthCookies = false
      const baseUrl = req.headers.get('origin') || `${req.protocol}://${req.headers.get('host')}`
      fileURL = `${baseUrl}${url}`
    }

    let cookies = (req.headers.get('cookie') ?? '').split(';')

    if (trimAuthCookies) {
      cookies = cookies.filter(
        (cookie) => !cookie.trim().startsWith(req.payload.config.cookiePrefix),
      )
    }

    const headers = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
      : {
          cookie: cookies.join(';'),
        }

    const { response, url: resolvedURL } = await fetchWithRedirects({
      allowList: uploadConfig.pasteURL ? uploadConfig.pasteURL.allowList : undefined,
      headers,
      skipSafeFetch: uploadConfig.skipSafeFetch,
      url: fileURL,
    })

    if (!response.ok) {
      throw new APIError(`Failed to fetch file from ${resolvedURL}`, response.status)
    }

    const data = await response.arrayBuffer()

    return {
      name: filename,
      data: Buffer.from(data),
      mimetype: response.headers.get('content-type') || undefined!,
      size: Number(response.headers.get('content-length')) || 0,
    }
  }

  throw new APIError('Invalid file url', 400)
}
