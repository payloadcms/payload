/* eslint-disable no-restricted-exports */
import type { CollectionSlug, JoinQuery, Payload, SelectType, TypedLocale } from '../../../index.js'
import type {
  ApplyDisableErrors,
  Document,
  PayloadRequest,
  RequestContext,
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
> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  currentDepth?: number
  depth?: number
  disableErrors?: TDisableErrors
  draft?: boolean
  fallbackLocale?: TypedLocale
  id: number | string
  includeLockStatus?: boolean
  joins?: JoinQuery
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export default async function findByIDLocal<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TDisableErrors, TSelect>,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> {
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
