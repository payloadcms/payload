import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js'
import type { Payload } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown> & TypeWithID
  payload: Payload
  req: PayloadRequest
}

export const resetLoginAttempts = async ({
  collection,
  doc,
  payload,
  req,
}: Args): Promise<void> => {
  if (
    !('lockUntil' in doc && typeof doc.lockUntil === 'string') &&
    (!('loginAttempts' in doc) || doc.loginAttempts === 0)
  ) {
    return
  }
  await payload.db.updateOne({
    id: doc.id,
    collection: collection.slug,
    data: {
      lockUntil: null,
      loginAttempts: 0,
    },
    req,
    returning: false,
  })
}
