import type { PayloadRequest } from '../types/index.js'
import type { UploadInstructionsAccess } from './types.js'

import { Forbidden } from '../errors/Forbidden.js'

/**
 * Runs a storage adapter's `clientUploads.access` rule. Without one, any logged-in user may
 * receive upload instructions.
 */
export const assertUploadInstructionsAccess = async ({
  access,
  collectionSlug,
  req,
}: {
  access?: UploadInstructionsAccess
  collectionSlug: string
  req: PayloadRequest
}): Promise<void> => {
  const isAllowed = access ? await access({ collectionSlug, req }) : Boolean(req.user)

  if (!isAllowed) {
    throw new Forbidden(req.t)
  }
}
