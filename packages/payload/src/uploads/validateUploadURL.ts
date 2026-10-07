import type { UploadConfig } from './types.js'

import { APIError } from '../errors/APIError.js'
import { isURLAllowed } from '../utilities/isURLAllowed.js'

/**
 * Validates the initial URL and collection policy before downloading a new URL upload.
 * MCP and the Admin proxy require an explicit allow-list. The local CLI may omit one,
 * but still respects `pasteURL: false` and any configured allow-list.
 * For example, an allowed `https://cdn.example.com/image.png` returns a parsed URL.
 */
export const validateUploadURL = ({
  requireAllowList = true,
  uploadConfig,
  url,
}: {
  requireAllowList?: boolean
  uploadConfig?: UploadConfig
  url: string
}): URL => {
  if (!uploadConfig) {
    throw new APIError('This collection does not support file uploads.', 400)
  }

  if (uploadConfig.pasteURL === false) {
    throw new APIError('Uploading files from URLs is disabled for this collection.', 400)
  }

  const allowList = uploadConfig.pasteURL?.allowList

  if (requireAllowList && !Array.isArray(allowList)) {
    throw new APIError('Server-side URL uploads require upload.pasteURL.allowList.', 400)
  }

  let parsedURL: URL

  try {
    parsedURL = new URL(url)
  } catch {
    throw new APIError('A valid URL string is required.', 400)
  }

  if (!['http:', 'https:'].includes(parsedURL.protocol)) {
    throw new APIError('File URLs must use http or https.', 400)
  }

  if (allowList && !isURLAllowed(parsedURL.href, allowList)) {
    throw new APIError('The provided file URL is not allowed.', 400)
  }

  return parsedURL
}
