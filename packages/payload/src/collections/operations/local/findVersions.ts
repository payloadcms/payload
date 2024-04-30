import type { PaginatedDocs } from '../../../database/types.js'
import type { GeneratedTypes, Payload } from '../../../index.js'
import type {
  Document,
  PayloadRequestWithData,
  RequestContext,
  Where,
} from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionsOperation } from '../findVersions.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  limit?: number
  locale?: 'all' | GeneratedTypes['locale']
  overrideAccess?: boolean
  page?: number
  req?: PayloadRequestWithData
  showHiddenFields?: boolean
  sort?: string
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<PaginatedDocs<TypeWithVersion<GeneratedTypes['collections'][T]>>> {
  const {
    collection: collectionSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
    showHiddenFields,
    sort,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Versions Operation.`,
    )
  }

  return findVersionsOperation({
    collection,
    depth,
    limit,
    overrideAccess,
    page,
    req: await createLocalReq(options, payload),
    showHiddenFields,
    sort,
    where,
  })
}
