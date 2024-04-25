import type { GeneratedTypes, Payload } from '../../../index.js'
import type { Document, PayloadRequestWithData, RequestContext } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionByIDOperation } from '../findVersionByID.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  id: string
  locale?: 'all' | GeneratedTypes['locale']
  overrideAccess?: boolean
  req?: PayloadRequestWithData
  showHiddenFields?: boolean
  user?: Document
}

export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['collections'][T]>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Find Version By ID Operation.`,
    )
  }

  return findVersionByIDOperation({
    id,
    collection,
    depth,
    disableErrors,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
