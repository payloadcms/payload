import type { PaginatedDocs } from '../../../database/types.js'
import type { CollectionSlug, JoinQuery, Payload, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  RequestContext,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../../types/index.js'
import type { SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOperation } from '../find.js'

export type Options<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: TypedLocale
  includeLockStatus?: boolean
  joins?: JoinQuery
  limit?: number
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
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
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>> {
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
    select,
    // select,
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
