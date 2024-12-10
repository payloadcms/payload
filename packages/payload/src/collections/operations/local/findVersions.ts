import type { PaginatedDocs } from '../../../database/types.js'
import type { CollectionSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  Where,
} from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { DataFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionsOperation } from '../findVersions.js'

export type Options<TSlug extends CollectionSlug> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  limit?: number
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  page?: number
  populate?: PopulateType
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  sort?: Sort
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>> {
  const {
    collection: collectionSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
    populate,
    select,
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
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
