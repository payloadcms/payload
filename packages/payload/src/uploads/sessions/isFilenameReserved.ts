import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { getOriginalFilename } from '../fileVersioning/naming.js'
import { uploadSessionsCollectionSlug } from './slug.js'

/**
 * Whether an unfinished upload session holds this filename. A session's object key contains its
 * filename, so the name stays reserved for the whole multi-day transfer instead of being re-picked
 * at completion. Callers may pass either the display name or its `-original` form.
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
  // Only projects with a segmented storage adapter register the sessions collection.
  if (!req.payload?.collections?.[uploadSessionsCollectionSlug]) {
    return false
  }

  const candidates = new Set([filename])

  try {
    candidates.add(getOriginalFilename({ filename }))
  } catch {
    // Not a name that has an `-original` form; the exact match still applies.
  }

  const { totalDocs } = await req.payload.db.count({
    collection: uploadSessionsCollectionSlug as CollectionSlug,
    req,
    where: {
      and: [
        { collectionSlug: { equals: collectionSlug } },
        { reservedFilename: { in: [...candidates] } },
        { status: { in: ['pending', 'active'] } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
  })

  return totalDocs > 0
}
