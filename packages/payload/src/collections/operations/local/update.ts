import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes, Payload } from '../../../index.js'
import type {
  Document,
  PayloadRequestWithData,
  RequestContext,
  Where,
} from '../../../types/index.js'
import type { File } from '../../../uploads/types.js'
import type { BulkOperationResult } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { getFileByPath } from '../../../uploads/getFileByPath.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'
import { updateByIDOperation } from '../updateByID.js'

export type BaseOptions<TSlug extends keyof GeneratedTypes['collections']> = {
  autosave?: boolean
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  data: DeepPartial<GeneratedTypes['collections'][TSlug]>
  depth?: number
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  file?: File
  filePath?: string
  locale?: GeneratedTypes['locale']
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req?: PayloadRequestWithData
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  id: number | string
  where?: never
}

export type ManyOptions<TSlug extends keyof GeneratedTypes['collections']> = BaseOptions<TSlug> & {
  id?: never
  where: Where
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> =
  | ByIDOptions<TSlug>
  | ManyOptions<TSlug>

async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ByIDOptions<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    id,
    autosave,
    collection: collectionSlug,
    data,
    depth,
    draft,
    file,
    filePath,
    overrideAccess = true,
    overwriteExistingFiles = false,
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
    draft,
    overrideAccess,
    overwriteExistingFiles,
    payload,
    req,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return updateByIDOperation<TSlug>(args)
  }
  return updateOperation<TSlug>(args)
}

export default updateLocal
