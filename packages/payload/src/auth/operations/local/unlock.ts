import type { GeneratedTypes, RequestContext } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import unlock from '../unlock'

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

  const req = createLocalReq(options, payload)

  return unlock({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localUnlock
