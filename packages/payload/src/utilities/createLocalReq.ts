import type { Payload, RequestContext } from '..'
import type { PayloadRequest } from '../exports/types'

import { getDataLoader } from '../collections/dataloader'
import { i18nInit } from '../translations/init'
import isolateObjectProperty from './isolateObjectProperty'

function getRequestContext(
  req: PayloadRequest = { context: null } as PayloadRequest,
  context: RequestContext = {},
): RequestContext {
  if (req.context) {
    if (Object.keys(req.context).length === 0 && req.context.constructor === Object) {
      // if req.context is `{}` avoid unnecessary spread
      return context
    } else {
      return { ...req.context, ...context }
    }
  } else {
    return context
  }
}

type CreateLocalReq = (
  options: {
    collection?: number | string | symbol
    context?: RequestContext
    fallbackLocale?: string
    locale?: string
    req?: PayloadRequest
    user?: Document
  },
  payload: Payload,
) => PayloadRequest
export const createLocalReq: CreateLocalReq = (
  { collection, context, fallbackLocale, locale, req = {} as PayloadRequest, user },
  payload,
) => {
  const i18n = req?.i18n || i18nInit(payload.config?.i18n)

  if (payload.config?.localization) {
    const defaultLocale = payload.config.localization.defaultLocale
    req.locale = locale || req?.locale || defaultLocale
    const fallbackLocaleFromConfig = payload.config.localization.locales.find(
      ({ code }) => req.locale === code,
    )?.fallbackLocale
    if (typeof fallbackLocale !== 'undefined') {
      req.fallbackLocale = fallbackLocale
    } else if (typeof req?.fallbackLocale === 'undefined') {
      req.fallbackLocale = fallbackLocaleFromConfig || defaultLocale
    }
  }

  req.context = getRequestContext(req, context)
  req.payloadAPI = req?.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.user = user || req?.user || null
  req.payloadDataLoader = req?.payloadDataLoader || getDataLoader(req)
  req = isolateObjectProperty(req, 'collection')

  req.collection = payload.collections[collection]

  return req
}
