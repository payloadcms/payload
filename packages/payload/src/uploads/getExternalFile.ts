import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { getRequestOrigin } from '../utilities/getRequestOrigin.js'
import { isURLAllowed } from '../utilities/isURLAllowed.js'
import { safeFetch } from './safeFetch.js'

type Args = {
  data: Pick<FileData, 'filename' | 'url'>
  req: PayloadRequest
  uploadConfig: UploadConfig
}

const hasProtocol = (url: string): boolean => /^[a-z][a-z\d+.-]*:/i.test(url)

const validateFileURL = (url: URL): URL => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new APIError('External file URLs must use HTTP or HTTPS.', 400)
  }

  return url
}

const parseFileURL = (url: string, base?: URL): URL => {
  try {
    return validateFileURL(new URL(url, base))
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    throw new APIError('Invalid external file URL.', 400)
  }
}

const getRequestBaseURL = (req: PayloadRequest): undefined | URL => {
  try {
    const requestURL = validateFileURL(new URL(req.url!))
    const host = req.headers.get('host') || requestURL.host

    return validateFileURL(new URL(`${requestURL.protocol}//${host}`))
  } catch {
    return undefined
  }
}

export const getExternalFile = async ({ data, req, uploadConfig }: Args): Promise<File> => {
  const { filename, url } = data

  if (typeof url === 'string') {
    let baseOrigin: string | undefined
    let parsedFileURL: URL

    if (hasProtocol(url)) {
      parsedFileURL = parseFileURL(url)
    } else {
      const requestOrigin = getRequestOrigin({ config: req.payload.config, req })
      let requestBaseURL: undefined | URL

      if (requestOrigin) {
        requestBaseURL = parseFileURL(requestOrigin)
        baseOrigin = requestBaseURL.origin
      } else {
        requestBaseURL = getRequestBaseURL(req)
      }

      if (!requestBaseURL) {
        throw new APIError('Unable to determine an HTTP(S) base URL for the external file.', 400)
      }

      parsedFileURL = parseFileURL(url, requestBaseURL)
    }

    let fileURL = parsedFileURL.toString()
    const requestHeaders = Object.fromEntries(new Headers(req.headers))
    const cookies = (req.headers.get('cookie') ?? '').split(';')

    let res
    let redirectCount = 0
    const maxRedirects = 3

    while (redirectCount <= maxRedirects) {
      const isSameOrigin = Boolean(baseOrigin && new URL(fileURL).origin === baseOrigin)
      const headers = uploadConfig.externalFileHeaderFilter
        ? uploadConfig.externalFileHeaderFilter(
            { ...requestHeaders },
            { isSameOrigin, url: fileURL },
          )
        : {
            cookie: cookies
              .filter(
                (cookie) =>
                  isSameOrigin || !cookie.trim().startsWith(req.payload.config.cookiePrefix),
              )
              .join(';'),
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
          fileURL = parseFileURL(location, new URL(fileURL)).toString()
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
