import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

import type { PayloadRequest } from '../../types/index.js'
import type { FileSource } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { fetchUploadResponse } from '../getFileFromUploadInstructions.js'
import { createFileSource } from './createFileSource.js'

/** Resolve bytes lazily from upload memory, a temporary file, or a verified provider reference. */
export function createUploadFileSource({
  collectionSlug,
  file,
  req,
}: {
  collectionSlug: string
  file: NonNullable<PayloadRequest['file']>
  req: PayloadRequest
}): FileSource {
  if (!file.tempFilePath && file.data.length === file.size) {
    return createFileSource({ file: new File([file.data], file.name, { type: file.mimetype }) })
  }

  return createFileSource({
    filename: file.name,
    mimeType: file.mimetype,
    retrieve: async () => {
      if (file.tempFilePath) {
        return new Response(
          Readable.toWeb(createReadStream(file.tempFilePath)) as ReadableStream<Uint8Array>,
        )
      }

      if (!file.uploadReference) {
        throw new TransformerContractError(
          'Upload source has no complete file or provider reference.',
        )
      }

      const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
        | { filename?: string }
        | undefined

      return fetchUploadResponse({
        collectionSlug,
        file: {
          filename: verifiedOriginal?.filename ?? file.name,
          mimeType: file.mimetype,
          size: file.size,
          uploadReference: file.uploadReference as Record<string, unknown>,
        },
        req,
        uploadConfig: req.payload.collections[collectionSlug]!.config.upload,
      })
    },
    size: file.size,
  })
}
