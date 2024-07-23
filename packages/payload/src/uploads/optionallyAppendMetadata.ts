import type { Sharp, Metadata as SharpMetadata } from 'sharp'

import type { PayloadRequest } from '../types/index.js'

export function optionallyAppendMetadata({
  metadata,
  req,
  sharpFile,
  withMetadata,
}: {
  metadata: SharpMetadata
  req: PayloadRequest
  sharpFile: Sharp
  withMetadata: ((options: { metadata: SharpMetadata; req?: PayloadRequest }) => boolean) | boolean
}) {
  if (withMetadata === true) {
    return sharpFile.withMetadata()
  } else if (typeof withMetadata === 'function') {
    const useMetadata = withMetadata({ metadata })

    if (useMetadata) return sharpFile.withMetadata()
  }

  return sharpFile
}
