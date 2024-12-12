import type { DeepPartial } from 'ts-essentials'

import type {
  AllowedDepth,
  CollectionSlug,
  DefaultDepth,
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
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type {
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { duplicateOperation } from '../duplicate.js'

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
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: TDepth
  disableTransaction?: boolean
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  id: number | string
  locale?: TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export async function duplicate<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect, TDepth>,
): Promise<ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>> {
  const {
    id,
    collection: collectionSlug,
    data,
    depth,
    disableTransaction,
    draft,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options
  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Duplicate Operation.`,
    )
  }

  if (collection.config.disableDuplicate === true) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} cannot be duplicated.`,
      400,
    )
  }

  const req = await createLocalReq(options, payload)

  return duplicateOperation<TSlug, TSelect>({
    id,
    collection,
    data,
    depth,
    disableTransaction,
    draft,
    overrideAccess,
    populate,
    req,
    select,
    showHiddenFields,
  })
}
