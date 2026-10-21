import type { PayloadRequest } from 'payload'
import type { Metadata, Sharp } from 'sharp'

import type { WithMetadata } from './types.js'

export async function optionallyAppendMetadata({
  metadataFormat,
  req,
  sharpFile,
  withMetadata,
}: {
  metadataFormat?: Metadata['format']
  req: PayloadRequest
  sharpFile: Sharp
  withMetadata: undefined | WithMetadata
}): Promise<Sharp> {
  const metadata = await sharpFile.metadata()

  // A private lossless intermediate does not change the format exposed to the callback.
  if (metadataFormat) {
    metadata.format = metadataFormat
  }

  if (withMetadata === true) {
    return sharpFile.withMetadata()
  } else if (typeof withMetadata === 'function') {
    const useMetadata = await withMetadata({ metadata, req })

    if (useMetadata) {
      return sharpFile.withMetadata()
    }
  }

  return sharpFile
}
