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

const attachFakeURLProperties = (req: PayloadRequest) => {
  /**
   * *NOTE*
   * If no URL is provided, the local API was called directly outside
   * the context of a request. Therefore we create a fake URL object.
   * `ts-ignore` is used below for properties that are 'read-only'
   * since they do not exist yet we can safely ignore the error.
   */
  try {
    const urlProperties = new URL(req.payload.config?.serverURL)
    req.host = urlProperties.host
    req.protocol = urlProperties.protocol
    req.pathname = urlProperties.pathname
    // @ts-ignore
    req.searchParams = urlProperties.searchParams
    // @ts-ignore
    req.origin = urlProperties.origin
    // @ts-ignore
    req.url = urlProperties.href
    return
  } catch (error) {
    /** do nothing */
  }

  req.host = 'localhost'
  req.protocol = 'https:'
  req.pathname = '/'
  // @ts-ignore
  req.searchParams = new URLSearchParams()
  // @ts-ignore
  req.origin = 'http://localhost'
  // @ts-ignore
  req.url = 'http://localhost'
  return
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
) => Promise<PayloadRequest>
export const createLocalReq: CreateLocalReq = async (
  { context, fallbackLocale, locale, req = {} as PayloadRequest, user },
  payload,
) => {
  const i18n = req?.i18n || (await getLocalI18n({ config: payload.config }))

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

  if (!req?.url) attachFakeURLProperties(req)

  return req
}
