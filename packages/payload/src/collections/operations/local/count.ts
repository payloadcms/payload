import type { GeneratedTypes } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document, Where } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import count from '../count'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  disableErrors?: boolean
  locale?: string
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
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return count<GeneratedTypes['collections'][T]>({
    collection,
    disableErrors,
    overrideAccess,
    req,
    where,
  })
}
