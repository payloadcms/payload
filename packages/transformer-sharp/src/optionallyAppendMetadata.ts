import type { PayloadRequest } from 'payload'
import type { Sharp } from 'sharp'

import type { WithMetadata } from './types.js'

export async function optionallyAppendMetadata({
  req,
  sharpFile,
  withMetadata,
}: {
  req: PayloadRequest
  sharpFile: Sharp
  withMetadata: undefined | WithMetadata
}): Promise<Sharp> {
  const metadata = await sharpFile.metadata()

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
