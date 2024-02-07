import type { Payload, RequestContext } from '..'
import type { PayloadRequest } from '../exports/types'

import { getDataLoader } from '../collections/dataloader'
import { getLocalI18n } from '../translations/getLocalI18n'

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
    context?: RequestContext
    fallbackLocale?: string
    locale?: string
    req?: PayloadRequest
    user?: Document
  },
  payload: Payload,
) => PayloadRequest
export const createLocalReq: CreateLocalReq = (
  { context, fallbackLocale, locale, req = {} as PayloadRequest, user },
  payload,
) => {
  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

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
  req.searchParams = req?.searchParams || new URLSearchParams()
  req.pathname = req?.pathname || null

  return req
}
