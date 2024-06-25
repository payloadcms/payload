import type { GeneratedTypes, Payload } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext, Where } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { countOperation } from '../count.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  locale?: GeneratedTypes['locale']
  overrideAccess?: boolean
  req?: PayloadRequest
  user?: Document
  where?: Where
}

export default async function countLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<{ totalDocs: number }> {
  const { collection: collectionSlug, disableErrors, overrideAccess = true, where } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Count Operation.`,
    )
  }

  return countOperation({
    collection,
    disableErrors,
    overrideAccess,
    req: await createLocalReq(options, payload),
    where,
  })
}
