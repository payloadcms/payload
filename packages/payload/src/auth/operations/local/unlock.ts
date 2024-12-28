import type {
  AuthOperationsFromCollectionSlug,
  CollectionSlug,
  Payload,
  RequestContext,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { unlockOperation } from '../unlock.js'

export type Options<TSlug extends CollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['unlock']
  overrideAccess: boolean
  req?: Partial<PayloadRequest>
}

async function localUnlock<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<boolean> {
  const { collection: collectionSlug, data, overrideAccess = true } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Unlock Operation.`,
    )
  }

  return unlockOperation<TSlug>({
    collection,
    data,
    overrideAccess,
    req: await createLocalReq(options, payload),
  })
}

export const unlock = localUnlock
