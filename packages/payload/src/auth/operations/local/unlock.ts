import type { Payload, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import { unlockOperation } from '../unlock'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    email
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localUnlock<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<boolean> {
  const { collection: collectionSlug, data, overrideAccess = true } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Unlock Operation.`,
    )
  }

  return unlockOperation({
    collection,
    data,
    overrideAccess,
    req: createLocalReq(options, payload),
  })
}

export default localUnlock
