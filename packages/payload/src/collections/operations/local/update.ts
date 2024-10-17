import type { DeepPartial } from 'ts-essentials'

import type { CollectionSlug, Payload, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  RequestContext,
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

export type BaseOptions<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  autosave?: boolean
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: number
  disableTransaction?: boolean
  draft?: boolean
  fallbackLocale?: TypedLocale
  file?: File
  filePath?: string
  locale?: TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  publishSpecificLocale?: string
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
  limit?: never
  where?: never
} & BaseOptions<TSlug, TSelect>

export type ManyOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = {
  id?: never
  limit?: number
  where: Where
} & BaseOptions<TSlug, TSelect>

export type Options<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
> = ByIDOptions<TSlug, TSelect> | ManyOptions<TSlug, TSelect>

async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ByIDOptions<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: ManyOptions<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect>>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>>
async function updateLocal<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
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
    publishSpecificLocale,
    req,
    select,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return updateByIDOperation<TSlug, TSelect>(args)
  }
  return updateOperation<TSlug, TSelect>(args)
}

export default updateLocal
