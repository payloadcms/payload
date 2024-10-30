import type { CollectionSlug, Payload, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  RequestContext,
  SelectType,
  TransformCollectionWithSelect,
  Where,
} from '../../../types/index.js'
import type { BulkOperationResult, SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { deleteOperation } from '../delete.js'
import { deleteByIDOperation } from '../deleteByID.js'

export type BaseOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = {
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
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  id: number | string
  where?: never
} & BaseOptions<TSlug, TSelect>

export type ManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  id?: never
  where: Where
} & BaseOptions<TSlug, TSelect>

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = ByIDOptions<TSlug, TSelect> | ManyOptions<TSlug, TSelect>

async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ByIDOptions<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    overrideAccess = true,
    overrideLock,
    select,
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
    select,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByIDOperation<TSlug, TSelect>(args)
  }
  return deleteOperation<TSlug, TSelect>(args)
}

export default deleteLocal
