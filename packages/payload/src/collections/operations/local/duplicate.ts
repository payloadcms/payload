import type { CollectionSlug, TypedLocale } from '../../..//index.js'
import type { Payload } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  RequestContext,
  SelectType,
  TransformCollectionWithSelect,
} from '../../../types/index.js'
import type { DataFromCollectionSlug, SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { duplicateOperation } from '../duplicate.js'

export type Options<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableTransaction?: boolean
  draft?: boolean
  fallbackLocale?: TypedLocale
  id: number | string
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export async function duplicate<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    draft,
    overrideAccess = true,
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
    depth,
    disableTransaction,
    draft,
    overrideAccess,
    req,
    select,
    showHiddenFields,
  })
}
