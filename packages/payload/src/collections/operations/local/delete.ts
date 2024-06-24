import type { CollectionSlug, Payload, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequestWithData,
  RequestContext,
  Where,
} from '../../../types/index.js'
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
  fallbackLocale?: TypedLocale
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequestWithData
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<TSlug extends CollectionSlug> = BaseOptions<TSlug> & {
  id: number | string
  where?: never
}

export type ManyOptions<TSlug extends CollectionSlug> = BaseOptions<TSlug> & {
  id?: never
  where: Where
}

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
    overrideAccess = true,
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
    overrideAccess,
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
