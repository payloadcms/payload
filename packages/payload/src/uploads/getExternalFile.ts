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
      // URL is relative - resolve against the trusted, server-configured serverURL.
      // Do NOT trust client-supplied Origin/Host headers here, as they can be
      // spoofed to point at attacker-controlled hosts (SSRF, CWE-918).
      const baseUrl = req.payload.config.serverURL
      if (!baseUrl) {
        throw new APIError(
          'Cannot fetch relative file URL: `serverURL` is not configured.',
          400,
        )
      }
      fileURL = `${baseUrl}${url}`
    }

    // Strip auth cookies from any forwarded cookie header. We never want to
    // forward the caller's session cookies to an outbound fetch — even for
    // same-origin requests — because the resulting response bytes are stored
    // as an upload and could leak authenticated content (e.g. admin API
    // responses) back to the uploading user.
    const cookies = (req.headers.get('cookie') ?? '')
      .split(';')
      .filter((cookie) => !cookie.trim().startsWith(req.payload.config.cookiePrefix))

    const headers = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(Object.fromEntries(new Headers(req.headers)))
      : {
          cookie: cookies.join(';'),
        }

    let res
    let redirectCount = 0
    const maxRedirects = 3

    while (redirectCount <= maxRedirects) {
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
