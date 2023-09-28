import type { Config as GeneratedTypes } from 'payload/generated-types'

import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import { getDataLoader } from '../../dataloader'
import findByID from '../findByID'

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
  payload: Payload,
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
  setRequestContext(options.req, context)

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

  req.payloadAPI = req.payloadAPI || 'local'
  req.locale = locale ?? req?.locale ?? defaultLocale
  req.fallbackLocale = fallbackLocaleToUse
  req.i18n = i18nInit(payload.config.i18n)
  req.payload = payload

  if (typeof user !== 'undefined') req.user = user

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findByID<GeneratedTypes['collections'][T]>({
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
