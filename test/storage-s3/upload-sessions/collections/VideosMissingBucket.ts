import type { CollectionConfig } from 'payload'

import { videosMissingBucketSlug } from '../../shared.js'

/** Stored in a bucket that does not exist, so S3 rejects every upload with a client fault. */
export const VideosMissingBucket: CollectionConfig = {
  slug: videosMissingBucketSlug,
  fields: [{ name: 'title', type: 'text' }],
  upload: {
    disableLocalStorage: true,
    transfer: {
      multipartThreshold: 6 * 1024 * 1024,
      preferredSegmentSize: 5 * 1024 * 1024,
    },
  },
  versions: false,
}
