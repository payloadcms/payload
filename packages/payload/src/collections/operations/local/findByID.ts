import type { CollectionSlug, JoinQuery, Payload, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { DataFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findByIDOperation } from '../findByID.js'

export type Options<TSlug extends CollectionSlug = CollectionSlug> = {
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
  id: number | string
  includeLockStatus?: boolean
  joins?: JoinQuery
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function findByIDLocal<TOptions extends Options>(
  payload: Payload,
  options: TOptions,
): Promise<
  TOptions['disableErrors'] extends true
    ? DataFromCollectionSlug<TOptions['collection']> | null
    : DataFromCollectionSlug<TOptions['collection']>
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
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
    )
  }

  return findByIDOperation<TOptions['collection']>({
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
    showHiddenFields,
  })
}
