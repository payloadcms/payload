import type { PayloadT } from '../../..'
import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../types'

type Args = {
  collection: SanitizedCollectionConfig
  doc: TypeWithID & Record<string, unknown>
  payload: PayloadT
  req: PayloadRequest
}

export const resetLoginAttempts = async ({
  collection,
  doc,
  payload,
  req,
}: Args): Promise<void> => {
  await payload.update({
    id: doc.id,
    collection: collection.slug,
    data: {
      lockUntil: null,
      loginAttempts: 0,
    },
    req,
  })
}
