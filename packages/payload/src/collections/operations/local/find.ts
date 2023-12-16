import type { GeneratedTypes } from '../../../'
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document, Where } from '../../../types'

import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import { getDataLoader } from '../../dataloader'
import find from '../find'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  user?: Document
  where?: Where
}

export default async function findLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<PaginatedDocs<GeneratedTypes['collections'][T]>> {
  const {
    collection: collectionSlug,
    context,
    currentDepth,
    depth,
    disableErrors,
    draft = false,
    fallbackLocale: fallbackLocaleArg,
    limit,
    locale: localeArg = null,
    overrideAccess = true,
    page,
    pagination = true,
    req = {} as PayloadRequest,
    showHiddenFields,
    sort,
    user,
    where,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]
  const localizationConfig = payload?.config?.localization
  const defaultLocale = localizationConfig ? localizationConfig.defaultLocale : null
  const locale = localeArg || req.locale || defaultLocale
  const fallbackLocale = localizationConfig
    ? localizationConfig.locales.find(({ code }) => locale === code)?.fallbackLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  req.payloadAPI = req.payloadAPI || 'local'
  req.locale = locale
  req.fallbackLocale =
    typeof fallbackLocaleArg !== 'undefined' ? fallbackLocaleArg : fallbackLocale || defaultLocale
  req.i18n = i18nInit(payload.config.i18n)
  req.payload = payload

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  if (typeof user !== 'undefined') req.user = user

  return find<GeneratedTypes['collections'][T]>({
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    limit,
    overrideAccess,
    page,
    pagination,
    req,
    showHiddenFields,
    sort,
    where,
  })
}
