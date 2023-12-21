import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes, PayloadT } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document, Where } from '../../../types'
import type { File } from '../../../uploads/types'
import type { BulkOperationResult } from '../../config/types'

import { APIError } from '../../../errors'
import { i18nInit } from '../../../translations/init'
import getFileByPath from '../../../uploads/getFileByPath'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { updateOperation } from '../update'
import { updateByIDOperation } from '../updateByID'

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
  fallbackLocale?: string
  file?: File
  filePath?: string
  locale?: string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req?: PayloadRequest
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
  payload: PayloadT,
  options: ByIDOptions<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>
async function updateLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    id,
    autosave,
    collection: collectionSlug,
    context,
    data,
    depth,
    draft,
    fallbackLocale,
    file,
    filePath,
    locale = null,
    overrideAccess = true,
    overwriteExistingFiles = false,
    req: incomingReq,
    showHiddenFields,
    user,
    where,
  } = options

  const collection = payload.collections[collectionSlug]
  const i18n = i18nInit(payload.config.i18n)
  const defaultLocale = payload.config.localization
    ? payload.config.localization?.defaultLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Update Operation.`,
    )
  }

  const req = {
    fallbackLocale: typeof fallbackLocale !== 'undefined' ? fallbackLocale : defaultLocale,
    files: {
      file: file ?? (await getFileByPath(filePath)),
    },
    i18n,
    locale: locale ?? defaultLocale,
    payload,
    payloadAPI: 'local',
    transactionID: incomingReq?.transactionID,
    user,
  } as unknown as PayloadRequest
  setRequestContext(req, context)

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

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
