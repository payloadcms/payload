import type { Sharp, Metadata as SharpMetadata } from 'sharp'

import type { PayloadRequest } from '../types/index.js'

export type WithMetadata =
  | ((options: { metadata: SharpMetadata; req: PayloadRequest }) => Promise<boolean>)
  | boolean

export async function optionallyAppendMetadata({
  req,
  sharpFile,
  withMetadata,
}: {
  req: PayloadRequest
  sharpFile: Sharp
  withMetadata: WithMetadata
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
