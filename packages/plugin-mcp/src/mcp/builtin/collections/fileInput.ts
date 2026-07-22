import type { CollectionSlug, File, FileData, PayloadRequest } from 'payload'

import { APIError } from 'payload'
import { getExternalFile, getFileFromUploadInstructions, isURLAllowed } from 'payload/internal'
import { sanitizeFilename } from 'payload/shared'
import { z } from 'zod'

const mimeTypeSchema = z
  .string()
  .regex(/^[!#$%&'*+.^`|~\w-]+\/[!#$%&'*+.^`|~\w-]+$/, 'MIME type must use the type/subtype format')

const uploadFileSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  uploadReference: z.record(z.string(), z.unknown()),
})

export const fileInputSchema = z
  .discriminatedUnion('source', [
    z.object({
      name: z.string().min(1).describe('The file name, including its extension'),
      data: z.string().describe('The base64-encoded file bytes, without a data URL prefix'),
      mimeType: mimeTypeSchema.describe('The file MIME type, for example image/png'),
      source: z.literal('base64'),
    }),
    z.object({
      name: z.string().min(1).describe('Optional file name override').optional(),
      source: z.literal('externalURL'),
      url: z.url().describe('The http or https URL to download'),
    }),
    z.object({
      file: uploadFileSchema.describe('getUploadInstructions file field post-upload'),
      source: z.literal('uploadReference'),
    }),
  ])
  .describe(
    'A file for an upload collection. Prefer uploadReference after its upload succeeds; use base64 only for small local files or externalURL for an online file.',
  )

type FileInput = z.infer<typeof fileInputSchema>

export async function resolveFile({
  collectionSlug,
  input,
  req,
}: {
  collectionSlug: CollectionSlug
  input?: FileInput
  req: PayloadRequest
}): Promise<File | undefined> {
  if (!input) {
    return undefined
  }

  if (input.source === 'uploadReference') {
    try {
      return await getFileFromUploadInstructions({ collectionSlug, file: input.file, req })
    } catch (error) {
      if (error instanceof Error && error.message === 'Staged upload was not found.') {
        throw new APIError(
          'Staged upload not found. Complete the upload action first, or use base64 for small local files.',
          400,
        )
      }
      throw error
    }
  }

  const uploadConfig = req.payload.collections[collectionSlug]?.config.upload

  if (!uploadConfig) {
    throw new APIError(`Collection "${collectionSlug}" does not support file uploads.`, 400)
  }

  const maxFileSize = req.payload.config.upload.limits?.fileSize
  let file: File

  if (input.source === 'base64') {
    const data = decodeBase64({ maxFileSize, value: input.data })

    file = {
      name: sanitizeFilename(input.name),
      data,
      mimetype: input.mimeType,
      size: data.length,
    }
  } else {
    if (uploadConfig.pasteURL === false) {
      throw new APIError(
        `Uploading files from URLs is disabled for collection "${collectionSlug}".`,
        400,
      )
    }

    const url = new URL(input.url)

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new APIError('File URLs must use http or https.', 400)
    }

    if (
      typeof uploadConfig.pasteURL === 'object' &&
      !isURLAllowed(input.url, uploadConfig.pasteURL.allowList)
    ) {
      throw new APIError('The provided file URL is not allowed.', 400)
    }

    file = await getExternalFile({
      data: {
        filename: sanitizeFilename(input.name || getURLFilename(url)),
        url: input.url,
      } as FileData,
      req,
      uploadConfig: {
        ...uploadConfig,
        externalFileHeaderFilter: uploadConfig.externalFileHeaderFilter ?? (() => ({})),
      },
    })
    file.mimetype = file.mimetype?.split(';')[0] || 'application/octet-stream'
    file.size = file.data.length
  }

  if (maxFileSize !== undefined && Number.isFinite(maxFileSize) && file.size > maxFileSize) {
    throw new APIError(`File exceeds the ${maxFileSize} byte upload limit.`, 400)
  }

  return file
}

function decodeBase64({ maxFileSize, value }: { maxFileSize?: number; value: string }): Buffer {
  const normalized = value.replace(/\s/g, '')

  if (!/^[a-z0-9+/]*={0,2}$/i.test(normalized) || normalized.length % 4 === 1) {
    throw new APIError('File data must be valid base64.', 400)
  }

  if (maxFileSize !== undefined && Number.isFinite(maxFileSize)) {
    const paddingLength = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
    const decodedSize = Math.floor((normalized.length * 3) / 4) - paddingLength

    if (decodedSize > maxFileSize) {
      throw new APIError(`File exceeds the ${maxFileSize} byte upload limit.`, 400)
    }
  }

  const data = Buffer.from(normalized, 'base64')

  if (data.toString('base64').replace(/=+$/, '') !== normalized.replace(/=+$/, '')) {
    throw new APIError('File data must be valid base64.', 400)
  }

  return data
}

function getURLFilename(url: URL): string {
  const pathSegment = url.pathname.split('/').pop() || 'upload'

  try {
    return decodeURIComponent(pathSegment)
  } catch {
    return pathSegment
  }
}
