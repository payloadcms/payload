import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { getRequestOrigin } from '../utilities/getRequestOrigin.js'
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
    let trustedServerURL = req.payload.config.serverURL

    if (!url.startsWith('http')) {
      trustedServerURL ||= getRequestOrigin({ config: req.payload.config, req })
      fileURL = new URL(url, trustedServerURL || req.origin).toString()
    }

    const trustedServerOrigin = trustedServerURL ? new URL(trustedServerURL).origin : null

    const customHeaders = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
      : undefined

    let res
    let redirectCount = 0
    const maxRedirects = 3

    while (redirectCount <= maxRedirects) {
      const isSameServerURL = trustedServerOrigin === new URL(fileURL).origin
      let headers = customHeaders

      if (!headers) {
        let cookies = (req.headers.get('cookie') ?? '').split(';')

        if (!isSameServerURL) {
          cookies = cookies.filter(
            (cookie) => !cookie.trim().startsWith(req.payload.config.cookiePrefix),
          )
        }

        headers = {
          cookie: cookies.join(';'),
        }

        if (isSameServerURL) {
          const origin = req.headers.get('origin')
          const secFetchSite = req.headers.get('sec-fetch-site')

          if (origin) {
            headers.origin = origin
          }

          if (secFetchSite) {
            headers['sec-fetch-site'] = secFetchSite
          }
        }
      }

      const skipSafeFetch: boolean =
        uploadConfig.skipSafeFetch === true
          ? uploadConfig.skipSafeFetch
          : Array.isArray(uploadConfig.skipSafeFetch) &&
            isURLAllowed(fileURL, uploadConfig.skipSafeFetch)

      const isAllowedPasteUrl: boolean | undefined =
        uploadConfig.pasteURL &&
        uploadConfig.pasteURL.allowList &&
        isURLAllowed(fileURL, uploadConfig.pasteURL.allowList)

      if (skipSafeFetch || isAllowedPasteUrl) {
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

      if (res.status >= 300 && res.status < 400) {
        redirectCount++
        if (redirectCount > maxRedirects) {
          throw new APIError(`Too many redirects (max ${maxRedirects})`, 403)
        }
        const location = res.headers.get('location')
        if (location) {
          fileURL = new URL(location, fileURL).toString()
          if (
            uploadConfig.pasteURL &&
            uploadConfig.pasteURL.allowList &&
            !isURLAllowed(fileURL, uploadConfig.pasteURL.allowList)
          ) {
            throw new APIError('Redirect target is not allowed.', 400)
          }
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
