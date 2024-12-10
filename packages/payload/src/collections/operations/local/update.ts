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
  Where,
} from '../../../types/index.js'
import type { File } from '../../../uploads/types.js'
import type {
  BulkOperationResult,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { getFileByPath } from '../../../uploads/getFileByPath.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'
import { updateByIDOperation } from '../updateByID.js'

export type BaseOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  autosave?: boolean
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: TDepth
  disableTransaction?: boolean
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  file?: File
  filePath?: string
  locale?: TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  publishSpecificLocale?: string
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
  limit?: never
  where?: never
} & BaseOptions<TSlug, TSelect, TDepth>

export type ManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  id?: never
  limit?: number
  where: Where
} & BaseOptions<TSlug, TSelect, TDepth>

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
> = ByIDOptions<TSlug, TSelect, TDepth> | ManyOptions<TSlug, TSelect, TDepth>

async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: ByIDOptions<TSlug, TSelect>,
): Promise<ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: ManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect, TDepth>>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<
  | ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>
  | BulkOperationResult<TSlug, TSelect, TDepth>
>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<
  | ApplyDepthInternal<TransformCollectionWithSelect<TSlug, TSelect>, TDepth>
  | BulkOperationResult<TSlug, TSelect, TDepth>
> {
  const {
    id,
    autosave,
    collection: collectionSlug,
    data,
    depth,
    disableTransaction,
    draft,
    file,
    filePath,
    limit,
    overrideAccess = true,
    overrideLock,
    overwriteExistingFiles = false,
    populate,
    publishSpecificLocale,
    select,
    showHiddenFields,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Update Operation.`,
    )
  }

  const req = await createLocalReq(options, payload)
  req.file = file ?? (await getFileByPath(filePath))

  const args = {
    id,
    autosave,
    collection,
    data,
    depth,
    disableTransaction,
    draft,
    limit,
    overrideAccess,
    overrideLock,
    overwriteExistingFiles,
    payload,
    populate,
    publishSpecificLocale,
    req,
    select,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return updateByIDOperation<TSlug, TSelect>(args)
  }
  return updateOperation<TSlug, TSelect, TDepth>(args)
}

export default updateLocal
