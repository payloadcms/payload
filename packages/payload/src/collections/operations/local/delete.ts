import type { GeneratedTypes } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document, Where } from '../../../types'
import type { BulkOperationResult } from '../../config/types'

import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import { getDataLoader } from '../../dataloader'
import deleteOperation from '../delete'
import deleteByID from '../deleteByID'

export type BaseOptions<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export type ByIDOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id: number | string
  where?: never
}

export type ManyOptions<T extends keyof GeneratedTypes['collections']> = BaseOptions<T> & {
  id?: never
  where: Where
}

export type Options<TSlug extends keyof GeneratedTypes['collections']> =
  | ByIDOptions<TSlug>
  | ManyOptions<TSlug>

async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ByIDOptions<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: ManyOptions<TSlug>,
): Promise<BulkOperationResult<TSlug>>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]>
async function deleteLocal<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<BulkOperationResult<TSlug> | GeneratedTypes['collections'][TSlug]> {
  const {
    id,
    collection: collectionSlug,
    context,
    depth,
    fallbackLocale: fallbackLocaleArg,
    locale: localeArg = null,
    overrideAccess = true,
    req: incomingReq = {} as PayloadRequest,
    showHiddenFields,
    user,
    where,
  } = options

  const collection = payload.collections[collectionSlug]
  const localizationConfig = payload?.config?.localization
  const defaultLocale = localizationConfig ? localizationConfig.defaultLocale : null
  const locale = localeArg || incomingReq?.locale || defaultLocale
  const fallbackLocale = localizationConfig
    ? localizationConfig.locales.find(({ code }) => locale === code)?.fallbackLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Delete Operation.`,
    )
  }

  const req = {
    fallbackLocale:
      typeof fallbackLocaleArg !== 'undefined'
        ? fallbackLocaleArg
        : fallbackLocale || defaultLocale,
    i18n: i18nInit(payload.config.i18n),
    locale: locale,
    payload,
    payloadAPI: 'local',
    transactionID: incomingReq?.transactionID,
    user,
  } as PayloadRequest
  setRequestContext(req, context)

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  const args = {
    id,
    collection,
    depth,
    overrideAccess,
    req,
    showHiddenFields,
    where,
  }

  if (options.id) {
    return deleteByID<TSlug>(args)
  }
  return deleteOperation<TSlug>(args)
}

export default deleteLocal
