import type { CollectionSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, Where } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { countVersionsOperation } from '../countVersions.js'

export type Options<TSlug extends CollectionSlug> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  user?: Document
  where?: Where
}

// eslint-disable-next-line no-restricted-exports
export default async function countVersionsLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<{ totalDocs: number }> {
  const { collection: collectionSlug, disableErrors, overrideAccess = true, where } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Count Versions Operation.`,
    )
  }

  return countVersionsOperation<TSlug>({
    collection,
    disableErrors,
    overrideAccess,
    req: await createLocalReq(options, payload),
    where,
  })
}
