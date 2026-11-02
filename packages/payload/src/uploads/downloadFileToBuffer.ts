import type { PayloadRequest } from '../types/index.js'
import type { File, FileData, UploadConfig } from './types.js'

import { APIError } from '../errors/index.js'
import { getRequestOrigin } from '../utilities/getRequestOrigin.js'
import { fetchWithRedirects, parseFileURL } from './fetchWithRedirects.js'

type Args = {
  data: Pick<FileData, 'filename' | 'url'>
  req: PayloadRequest
  uploadConfig: UploadConfig
}

const hasProtocol = (url: string): boolean => /^[a-z][a-z\d+.-]*:/i.test(url)

const getRequestBaseURL = (req: PayloadRequest): undefined | URL => {
  try {
    const requestURL = parseFileURL(req.url!)
    const host = req.headers.get('host') || requestURL.host

    return parseFileURL(`${requestURL.protocol}//${host}`)
  } catch {
    return undefined
  }
}

/** Downloads a file into a Payload File buffer, including existing files being resized or copied. */
export const downloadFileToBuffer = async ({ data, req, uploadConfig }: Args): Promise<File> => {
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

    const fileURL = parsedFileURL.toString()
    const requestHeaders = Object.fromEntries(new Headers(req.headers))
    const cookies = (req.headers.get('cookie') ?? '').split(';')

    const getHeaders = (currentURL: string): Record<string, string> => {
      const isSameOrigin = Boolean(baseOrigin && new URL(currentURL).origin === baseOrigin)

      return uploadConfig.externalFileHeaderFilter
        ? uploadConfig.externalFileHeaderFilter(
            { ...requestHeaders },
            { isSameOrigin, url: currentURL },
          )
        : {
            cookie: cookies
              .filter(
                (cookie) =>
                  isSameOrigin || !cookie.trim().startsWith(req.payload.config.cookiePrefix),
              )
              .join(';'),
          }
    }

    const { response, url: resolvedURL } = await fetchWithRedirects({
      allowList: uploadConfig.pasteURL ? uploadConfig.pasteURL.allowList : undefined,
      getHeaders,
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
