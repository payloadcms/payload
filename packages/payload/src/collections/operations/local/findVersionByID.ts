import type { GeneratedTypes, PayloadT } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { APIError } from '../../../errors'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findVersionByIDOperation } from '../findVersionByID'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['collections'][T]>> {
  const {
    id,
    collection: collectionSlug,
    context,
    depth,
    disableErrors = false,
    fallbackLocale,
    locale = null,
    overrideAccess = true,
    req = {} as PayloadRequest,
    showHiddenFields,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Find Version By ID Operation.`,
    )
  }

  let fallbackLocaleToUse = defaultLocale

  if (typeof req.fallbackLocale !== 'undefined') {
    fallbackLocaleToUse = req.fallbackLocale
  }

  if (typeof fallbackLocale !== 'undefined') {
    fallbackLocaleToUse = fallbackLocale
  }

  req.payloadAPI = req.payloadAPI || 'local'
  req.locale = locale ?? req?.locale ?? defaultLocale
  req.fallbackLocale = fallbackLocaleToUse
  req.i18n = {
    fallbackLanguage: payload.config.i18n.fallbackLanguage,
    language: payload.config.i18n.fallbackLanguage,
  }
  req.payload = payload

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findVersionByIDOperation({
    id,
    collection,
    depth,
    disableErrors,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
