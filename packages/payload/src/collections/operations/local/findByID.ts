/* eslint-disable no-restricted-exports */
import type {
  AllowedDepth,
  CollectionSlug,
  DefaultDepth,
  JoinQuery,
  Payload,
  RequestContext,
  SelectType,
  TypedLocale,
} from '../../../index.js'
import type {
  ApplyDepthInternal,
  ApplyDisableErrors,
  Document,
  PayloadRequest,
  PopulateType,
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type { SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findByIDOperation } from '../findByID.js'

export type Options<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
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
  disableErrors?: TDisableErrors
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  id: number | string
  includeLockStatus?: boolean
  joins?: JoinQuery<TSlug>
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export default async function findByIDLocal<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TDisableErrors, TSelect>,
): Promise<
  ApplyDisableErrors<
    ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>,
    TDisableErrors
  >
> {
  const {
    id,
    collection: collectionSlug,
    currentDepth,
    depth,
    disableErrors = false,
    draft = false,
    includeLockStatus,
    joins,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
    )
  }

  return findByIDOperation<TSlug, TDisableErrors, TSelect>({
    id,
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    includeLockStatus,
    joins,
    overrideAccess,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
