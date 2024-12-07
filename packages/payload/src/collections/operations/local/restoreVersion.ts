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
} from '../../../types/index.js'
import type { DataFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

export type Options<TSlug extends CollectionSlug, TDepth extends AllowedDepth = DefaultDepth> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: TDepth
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  id: string
  locale?: TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  user?: Document
}

export default async function restoreVersionLocal<
  TSlug extends CollectionSlug,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<ApplyDepthInternal<DataFromCollectionSlug<TSlug>, TDepth>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Restore Version Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    overrideAccess,
    payload,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  }

  return restoreVersionOperation(args)
}
