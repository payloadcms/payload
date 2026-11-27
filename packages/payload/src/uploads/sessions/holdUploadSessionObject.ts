import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/APIError.js'
import { CLIENT_UPLOAD_RECEIPT_LIFETIME_MS } from '../clientUploadReceipt.js'
import { uploadSessionsCollectionSlug } from './slug.js'

/**
 * Keeps the stored object of an upload session for another receipt lifetime, because a save can
 * run for minutes after it checked its file reference. This update and the cleanup claim cannot
 * both succeed, so cleanup never deletes an object a save still uses. Throws when cleanup already
 * started, since the object is gone or about to be.
 *
 * Runs while the receipt is checked, before the save's transaction starts, so cleanup sees it.
 */
export const holdUploadSessionObject = async ({
  id,
  req,
}: {
  id: number | string
  req: PayloadRequest
}): Promise<void> => {
  const now = new Date()

  const heldSession = await req.payload.db.updateOne({
    collection: uploadSessionsCollectionSlug,
    data: {
      fileReferencesValidUntil: new Date(
        now.getTime() + CLIENT_UPLOAD_RECEIPT_LIFETIME_MS,
      ).toISOString(),
      updatedAt: now.toISOString(),
    },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: id } },
        { cleanupCompletedAt: { exists: false } },
        // A cancelled or failed session holds its lease only while cleanup runs.
        {
          or: [
            { status: { in: ['pending', 'active'] } },
            { finalizingUntil: { exists: false } },
            { finalizingUntil: { equals: null } },
            { finalizingUntil: { less_than: now.toISOString() } },
          ],
        },
      ],
    },
  })

  if (!heldSession) {
    throw new APIError('Invalid upload reference.', 400)
  }
}
