import * as z from 'zod/mini'

import type { CollectionSlug } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { File } from './types.js'

import { APIError } from '../errors/index.js'
import { sanitizeFilename } from '../utilities/sanitizeFilename.js'
import { downloadFileToBuffer } from './downloadFileToBuffer.js'
import { validateUploadURL } from './validateUploadURL.js'

export const externalURLInputSchema = z.strictObject({
  name: z.optional(z.string().check(z.minLength(1))).check(z.describe('File name override.')),
  source: z.literal('externalURL'),
  url: z.url().check(z.describe('The http or https URL to download.')),
})

export type ExternalURLInput = z.infer<typeof externalURLInputSchema>

/**
 * Resolves caller-supplied URL upload input, not existing files being resized or copied.
 *
 * For example, `{ source: 'externalURL', url: 'https://example.com/image.png' }`
 * becomes a Payload `File` after applying `pasteURL`, allow-list, and size restrictions.
 * Remote callers require an explicit allow-list; the trusted local CLI can opt out.
 * Operation-specific access checks belong to the caller and the subsequent Payload operation.
 */
export const resolveURLUploadInput = async ({
  slug,
  input,
  req,
  requireAllowList = true,
}: {
  input: ExternalURLInput
  req: PayloadRequest
  requireAllowList?: boolean
  slug: CollectionSlug
}): Promise<File> => {
  const uploadConfig = req.payload.collections[slug]?.config.upload
  const url = validateUploadURL({ requireAllowList, uploadConfig, url: input.url })

  const file = await downloadFileToBuffer({
    data: {
      filename: sanitizeFilename(input.name || getURLFilename(url)),
      url: url.href,
    },
    req,
    uploadConfig: {
      ...uploadConfig,
      externalFileHeaderFilter: uploadConfig?.externalFileHeaderFilter ?? (() => ({})),
    },
  })

  file.mimetype = file.mimetype?.split(';')[0] || 'application/octet-stream'
  file.size = file.data.length

  const maxFileSize = req.payload.config.upload.limits?.fileSize

  if (maxFileSize !== undefined && Number.isFinite(maxFileSize) && file.size > maxFileSize) {
    throw new APIError(`File exceeds the ${maxFileSize} byte upload limit.`, 400)
  }

  return file
}

const getURLFilename = (url: URL): string => {
  const pathSegment = url.pathname.split('/').pop() || 'upload'

  try {
    return decodeURIComponent(pathSegment)
  } catch {
    return pathSegment
  }
}
