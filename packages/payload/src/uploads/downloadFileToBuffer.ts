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
    const { baseOrigin, url: parsedFileURL } = resolveExternalFileURL({ req, url })

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
      size: data.byteLength,
    }
  }

  throw new APIError('Invalid file url', 400)
}

/**
 * Resolves a file URL to an absolute HTTP(S) URL. Relative URLs resolve against the configured
 * request origin (returned as `baseOrigin`), falling back to the incoming request's host.
 */
export const resolveExternalFileURL = ({
  req,
  url,
}: {
  req: PayloadRequest
  url: string
}): { baseOrigin?: string; url: URL } => {
  if (hasProtocol(url)) {
    return { url: parseFileURL(url) }
  }

  const requestOrigin = getRequestOrigin({ config: req.payload.config, req })

  if (requestOrigin) {
    const requestBaseURL = parseFileURL(requestOrigin)

    return { baseOrigin: requestBaseURL.origin, url: parseFileURL(url, requestBaseURL) }
  }

  const requestBaseURL = getRequestBaseURL(req)

  if (!requestBaseURL) {
    throw new APIError('Unable to determine an HTTP(S) base URL for the external file.', 400)
  }

  return { url: parseFileURL(url, requestBaseURL) }
}
