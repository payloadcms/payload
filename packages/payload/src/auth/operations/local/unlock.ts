import type {
  AuthCollectionSlug,
  AuthOperationsFromCollectionSlug,
  Payload,
  RequestContext,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { warnMissingOverrideAccess } from '../../../utilities/warnMissingOverrideAccess.js'
import { unlockOperation } from '../unlock.js'

export type Options<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['unlock']
  overrideAccess: boolean
  req?: Partial<PayloadRequest>
}

export async function unlockLocal<TSlug extends AuthCollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<boolean> {
  const { collection: collectionSlug, data, overrideAccess: overrideAccessFromOptions } = options

  // An untyped caller — plain JavaScript, an `as any` cast, or a plugin whose JavaScript was
  // compiled against Payload 3 — can still omit this. Coerce once, here, so nothing further
  // in has to decide what a missing value means. `false` enforces access control, so the
  // failure mode is a missing document rather than a leaked one.
  if (overrideAccessFromOptions === undefined) {
    warnMissingOverrideAccess({ operation: 'payload.unlock', payload })
  }

  const overrideAccess = overrideAccessFromOptions ?? false

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
