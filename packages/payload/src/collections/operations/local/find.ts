import type { PaginatedDocs } from '../../../database/types.js'
import type {
  AllowedDepth,
  CollectionSlug,
  DefaultDepth,
  JoinQuery,
  Payload,
  RequestContext,
  TypedLocale,
} from '../../../index.js'
import type {
  ApplyDepthInternal,
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../../types/index.js'
import type { SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOperation } from '../find.js'

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  currentDepth?: number
  depth?: TDepth
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  includeLockStatus?: boolean
  joins?: JoinQuery<TSlug>
  limit?: number
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  sort?: Sort
  user?: Document
  where?: Where
}

export async function findLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect, TDepth>,
): Promise<
  PaginatedDocs<ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>>
> {
  const {
    collection: collectionSlug,
    currentDepth,
    depth,
    disableErrors,
    draft = false,
    includeLockStatus,
    joins,
    limit,
    overrideAccess = true,
    page,
    pagination = true,
    populate,
    select,
    showHiddenFields,
    sort,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  return findOperation<TSlug, TSelect>({
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    includeLockStatus,
    joins,
    limit,
    overrideAccess,
    page,
    pagination,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
