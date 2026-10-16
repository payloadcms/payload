import type { PayloadRequest } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { Forbidden } from '../errors/Forbidden.js'

/** Checks collection write permissions before an adapter grants access to upload file bytes. */
export const assertClientUploadAccess = async ({
  collectionSlug,
  req,
}: {
  collectionSlug: string
  req: PayloadRequest
}): Promise<void> => {
  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Forbidden(req.t)
  }

  const canCreate = await executeAccess(
    { disableErrors: true, req },
    collectionConfig.access.create,
  )

  if (canCreate) {
    return
  }

  const canUpdate = await executeAccess(
    { disableErrors: true, req },
    collectionConfig.access.update,
  )

  if (!canUpdate) {
    throw new Forbidden(req.t)
  }
}
