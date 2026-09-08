import type { CollectionSlug, File, PayloadRequest } from 'payload'

import { APIError, z } from 'payload'
import {
  externalURLInputSchema,
  getFileFromUploadInstructions,
  resolveURLUploadInput,
} from 'payload/internal'
import { sanitizeFilename } from 'payload/shared'

const mimeTypeSchema = z
  .string()
  .check(
    z.regex(
      /^[!#$%&'*+.^`|~\w-]+\/[!#$%&'*+.^`|~\w-]+$/,
      'MIME type must use the type/subtype format',
    ),
  )

const uploadFileSchema = z.strictObject({
  filename: z.string(),
  mimeType: z.string(),
  size: z.int().check(z.nonnegative()),
  uploadReference: z.record(z.string(), z.unknown()),
})

export const fileInputSchema = z
  .discriminatedUnion('source', [
    z.strictObject({
      name: z.string().check(z.minLength(1), z.describe('The file name, including its extension.')),
      data: z
        .string()
        .check(z.describe('The base64-encoded file bytes, without a data URL prefix.')),
      mimeType: mimeTypeSchema.check(z.describe('The file MIME type, for example image/png.')),
      source: z.literal('base64'),
    }),
    externalURLInputSchema,
    z.strictObject({
      file: uploadFileSchema.check(z.describe('getUploadInstructions file field post-upload.')),
      source: z.literal('uploadReference'),
    }),
  ])
  .check(
    z.describe(
      'A file for an upload collection. Prefer uploadReference after its upload succeeds; use base64 only for small local files or externalURL for an online file.',
    ),
  )

type FileInput = z.infer<typeof fileInputSchema>

export async function resolveFile({
  slug,
  input,
  req,
}: {
  input?: FileInput
  req: PayloadRequest
  slug: CollectionSlug
}): Promise<File | undefined> {
  if (!input) {
    return undefined
  }

  if (input.source === 'uploadReference') {
    try {
      return await getFileFromUploadInstructions({ collectionSlug: slug, file: input.file, req })
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

  if (input.source === 'externalURL') {
    return resolveURLUploadInput({ slug, input, req })
  }

  const uploadConfig = req.payload.collections[slug]?.config.upload

  if (!uploadConfig) {
    throw new APIError(`Collection "${slug}" does not support file uploads.`, 400)
  }

  const maxFileSize = req.payload.config.upload.limits?.fileSize
  const data = decodeBase64({ maxFileSize, value: input.data })
  const file: File = {
    name: sanitizeFilename(input.name),
    data,
    mimetype: input.mimeType,
    size: data.length,
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
