import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { uploadSessionsCollectionSlug } from './slug.js'

/**
 * Whether an unfinished upload session holds this filename. A session's object key contains its
 * filename, so the name stays reserved for the whole multi-day transfer instead of being re-picked
 * at completion.
 */
export const isFilenameReservedByUploadSession = async ({
  collectionSlug,
  filename,
  req,
}: {
  collectionSlug: string
  filename: string
  req: PayloadRequest
}): Promise<boolean> => {
  // Only collections with a segmented storage adapter can have sessions.
  if (!req.payload?.collections?.[collectionSlug]?.config.upload?.uploadInstructions?.segmented) {
    return false
  }

  const { totalDocs } = await req.payload.db.count({
    collection: uploadSessionsCollectionSlug as CollectionSlug,
    req,
    where: {
      and: [
        { collectionSlug: { equals: collectionSlug } },
        { reservedFilename: { equals: filename } },
        // Overdue sessions keep their name until the sweep ends them, matching the reservation key.
        { status: { in: ['pending', 'active'] } },
      ],
    },
  })

  return totalDocs > 0
}
