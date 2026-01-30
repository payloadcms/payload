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

    let res
    let redirectCount = 0
    const maxRedirects = 3

    while (redirectCount <= maxRedirects) {
      // Check if URL is allowed because of skipSafeFetch allowList
      const skipSafeFetch: boolean =
        uploadConfig.skipSafeFetch === true
          ? uploadConfig.skipSafeFetch
          : Array.isArray(uploadConfig.skipSafeFetch) &&
            isURLAllowed(fileURL, uploadConfig.skipSafeFetch)

      // Check if URL is allowed because of pasteURL allowList
      const isAllowedPasteUrl: boolean | undefined =
        uploadConfig.pasteURL &&
        uploadConfig.pasteURL.allowList &&
        isURLAllowed(fileURL, uploadConfig.pasteURL.allowList)

      if (skipSafeFetch || isAllowedPasteUrl) {
        // Allowed
        res = await fetch(fileURL, {
          credentials: 'include',
          headers,
          method: 'GET',
          redirect: 'manual',
        })
      } else {
        // Default
        res = await safeFetch(fileURL, {
          credentials: 'include',
          headers,
          method: 'GET',
        })
      }

      // Throw redirects errors
      if (res.status >= 300 && res.status < 400) {
        redirectCount++
        if (redirectCount > maxRedirects) {
          throw new APIError(`Too many redirects (max ${maxRedirects})`, 403)
        }
        const location = res.headers.get('location')
        if (location) {
          fileURL = new URL(location, fileURL).toString()
          continue
        }
      }

      break
    }

    if (!res || !res.ok) {
      throw new APIError(`Failed to fetch file from ${fileURL}`, res?.status)
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
