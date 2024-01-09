import type { GeneratedTypes } from '../../../'
import type { PayloadT } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findByIDOperation } from '../findByID'

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
  id: number | string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function findByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<GeneratedTypes['collections'][T]> {
  const {
    id,
    collection: collectionSlug,
    context,
    currentDepth,
    depth,
    disableErrors = false,
    draft = false,
    fallbackLocale,
    locale = null,
    overrideAccess = true,
    req = {} as PayloadRequest,
    showHiddenFields,
    user,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
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

  if (typeof user !== 'undefined') req.user = user

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findByIDOperation<GeneratedTypes['collections'][T]>({
    id,
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
