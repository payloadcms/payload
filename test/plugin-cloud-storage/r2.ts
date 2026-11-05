import type { R2StorageOptions } from '@payloadcms/storage-r2'
import type { Endpoint } from 'payload'

import { getHandleMultiPartUpload } from '../../packages/storage-r2/src/handleMultiPartUpload.js'
import { mediaSlug } from './shared.js'

// The integration suite supplies the emulator bucket without bundling Wrangler into test apps.
export const r2TestStorage: { bucket?: R2StorageOptions['bucket'] } = {}

export const r2UploadEndpoints: Endpoint[] = [false, true].map((hasCustomAccess) => ({
  handler: (req) => {
    if (!r2TestStorage.bucket) {
      throw new Error('R2 test bucket has not been initialized')
    }

    return getHandleMultiPartUpload({
      access: hasCustomAccess ? ({ req }) => !req.headers.has('x-disallow-access') : undefined,
      bucket: r2TestStorage.bucket,
      collections: { [mediaSlug]: true },
    })(req)
  },
  method: 'post',
  path: `/storage-r2-multi-part-upload${hasCustomAccess ? '-custom' : ''}`,
}))
