import httpStatus from 'http-status'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../types'

import { APIError } from '../../errors'

export type Arguments = {
  collection: Collection
  req: PayloadRequest
}

function logout(incomingArgs: Arguments): boolean {
  const {
    collection: { config: collectionConfig },
    req: { user },
  } = incomingArgs

  if (!user) throw new APIError('No User', httpStatus.BAD_REQUEST)
  if (user.collection !== collectionConfig.slug)
    throw new APIError('Incorrect collection', httpStatus.FORBIDDEN)

  return true
}

export default logout
