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
  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  if (payload.config?.localization) {
    const defaultLocale = payload.config.localization.defaultLocale
    req.locale = locale || req?.locale || defaultLocale
    req.fallbackLocale = fallbackLocale || req?.fallbackLocale || defaultLocale
  }

  req.context = getRequestContext(req, context)
  req.payloadAPI = req?.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.user = user || req?.user || null
  req.collection = collection ? payload?.collections?.[collection] : null
  req.payloadDataLoader = req?.payloadDataLoader || getDataLoader(req)

  return req
}
