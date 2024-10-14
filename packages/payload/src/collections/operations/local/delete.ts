import type { CollectionSlug, Payload, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext, Where } from '../../../types/index.js'
import type { BulkOperationResult, DataFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { deleteOperation } from '../delete.js'
import { deleteByIDOperation } from '../deleteByID.js'

export type BaseOptions<TSlug extends CollectionSlug> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableTransaction?: boolean
  fallbackLocale?: TypedLocale
  locale?: TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<TSlug extends CollectionSlug> = {
  id: number | string
  where?: never
} & BaseOptions<TSlug>

export type ManyOptions<TSlug extends CollectionSlug> = {
  id?: never
  where: Where
} & BaseOptions<TSlug>

export type Options<TSlug extends CollectionSlug> = ByIDOptions<TSlug> | ManyOptions<TSlug>

async function deleteLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ByIDOptions<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>>
async function deleteLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | DataFromCollectionSlug<TSlug>>
async function deleteLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | DataFromCollectionSlug<TSlug>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    overrideAccess = true,
    overrideLock,
    showHiddenFields,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    disableTransaction,
    overrideAccess,
    overrideLock,
    req: await createLocalReq(options, payload),
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByIDOperation<TSlug>(args)
  }
  return deleteOperation<TSlug>(args)
}

export default deleteLocal
