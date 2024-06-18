import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequestWithData } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { unlockOperation } from '../unlock.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    email
  }
  overrideAccess: boolean
  req?: PayloadRequestWithData
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
    req: await createLocalReq(options, payload),
  })
}

export default localUnlock
