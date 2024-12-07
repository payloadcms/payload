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
  Where,
} from '../../../types/index.js'
import type { BulkOperationResult, SelectFromCollectionSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { deleteOperation } from '../delete.js'
import { deleteByIDOperation } from '../deleteByID.js'

export type BaseOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: TDepth
  disableTransaction?: boolean
  fallbackLocale?: false | TypedLocale
  locale?: TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  id: number | string
  where?: never
} & BaseOptions<TSlug, TSelect, TDepth>

export type ManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  id?: never
  where: Where
} & BaseOptions<TSlug, TSelect, TDepth>

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
> = ByIDOptions<TSlug, TSelect, TDepth> | ManyOptions<TSlug, TSelect, TDepth>

async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: ByIDOptions<TSlug, TSelect, TDepth>,
): Promise<ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: ManyOptions<TSlug, TSelect, TDepth>,
): Promise<BulkOperationResult<TSlug, TSelect, TDepth>>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect, TDepth>,
): Promise<
  | ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>
  | BulkOperationResult<TSlug, TSelect, TDepth>
>
async function deleteLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect, TDepth>,
): Promise<
  | ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>
  | BulkOperationResult<TSlug, TSelect, TDepth>
> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableTransaction,
    overrideAccess = true,
    overrideLock,
    populate,
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
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByIDOperation<TSlug, TSelect>(args)
  }
  return deleteOperation<TSlug, TSelect, TDepth>(args)
}

export default deleteLocal
