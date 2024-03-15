import type { User } from '../auth/types.js'
import type { Payload, RequestContext } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getDataLoader } from '../collections/dataloader.js'
import { getLocalI18n } from '../translations/getLocalI18n.js'

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
    // @ts-expect-error
    req.searchParams = urlProperties.searchParams
    // @ts-expect-error
    req.origin = urlProperties.origin
    // @ts-expect-error
    req.url = urlProperties.href
    return
  } catch (error) {
    /** do nothing */
  }

  req.host = 'localhost'
  req.protocol = 'https:'
  req.pathname = '/'
  // @ts-expect-error
  req.searchParams = new URLSearchParams()
  // @ts-expect-error
  req.origin = 'http://localhost'
  // @ts-expect-error
  req.url = 'http://localhost'
  return
}

type CreateLocalReq = (
  options: {
    context?: RequestContext
    fallbackLocale?: string
    locale?: string
    req?: PayloadRequest
    user?: User
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
  req.routeParams = req?.routeParams || {}
  req.query = req?.query || {}

  if (!req?.url) attachFakeURLProperties(req)

  return req
}
