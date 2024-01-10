import type { GeneratedTypes, Payload } from '../../../'
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document, Where } from '../../../types'

import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findOperation } from '../find'

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
    fallbackLocale,
    limit,
    locale = null,
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
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  let fallbackLocaleToUse = defaultLocale

  if (typeof req.fallbackLocale !== 'undefined') {
    fallbackLocaleToUse = req.fallbackLocale
  }

  if (typeof fallbackLocale !== 'undefined') {
    fallbackLocaleToUse = fallbackLocale
  }

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payloadAPI = req.payloadAPI || 'local'
  req.locale = locale ?? req?.locale ?? defaultLocale
  req.fallbackLocale = fallbackLocaleToUse
  req.i18n = i18n
  req.t = i18n.t
  req.payload = payload

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  if (typeof user !== 'undefined') req.user = user

  return findOperation<GeneratedTypes['collections'][T]>({
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
