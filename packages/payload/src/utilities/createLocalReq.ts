// @ts-strict-ignore
import type { User } from '../auth/types.js'
import type { Payload, RequestContext, TypedLocale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getDataLoader } from '../collections/dataloader.js'
import { getLocalI18n } from '../translations/getLocalI18n.js'
import { sanitizeFallbackLocale } from '../utilities/sanitizeFallbackLocale.js'

function getRequestContext(
  req: Partial<PayloadRequest> = { context: null } as PayloadRequest,
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

const attachFakeURLProperties = (req: Partial<PayloadRequest>) => {
  /**
   * *NOTE*
   * If no URL is provided, the local API was called directly outside
   * the context of a request. Therefore we create a fake URL object.
   * `ts-expect-error` is used below for properties that are 'read-only'
   * since they do not exist yet we can safely ignore the error.
   */
  let urlObject

  function getURLObject() {
    if (urlObject) {
      return urlObject
    }
    const urlToUse = req?.url || req.payload.config?.serverURL || 'http://localhost'
    try {
      urlObject = new URL(urlToUse)
    } catch (error) {
      urlObject = new URL('http://localhost')
    }

    return urlObject
  }

  if (!req.host) {
    req.host = getURLObject().host
  }
  if (!req.protocol) {
    req.protocol = getURLObject().protocol
  }
  if (!req.pathname) {
    req.pathname = getURLObject().pathname
  }
  if (!req.searchParams) {
    // @ts-expect-error eslint-disable-next-line no-param-reassign
    req.searchParams = getURLObject().searchParams
  }
  if (!req.origin) {
    // @ts-expect-error eslint-disable-next-line no-param-reassign
    req.origin = getURLObject().origin
  }
  if (!req?.url) {
    // @ts-expect-error eslint-disable-next-line no-param-reassign
    req.url = getURLObject().href
  }
}

type CreateLocalReq = (
  options: {
    context?: RequestContext
    fallbackLocale?: false | TypedLocale
    locale?: string
    req?: Partial<PayloadRequest>
    user?: User
  },
  payload: Payload,
) => Promise<PayloadRequest>

export const createLocalReq: CreateLocalReq = async (
  { context, fallbackLocale, locale: localeArg, req = {} as PayloadRequest, user },
  payload,
) => {
  const localization = payload.config?.localization
  if (localization) {
    const locale = localeArg === '*' ? 'all' : localeArg
    const defaultLocale = localization.defaultLocale
    const localeCandidate = locale || req?.locale || req?.query?.locale

    req.locale =
      localeCandidate && typeof localeCandidate === 'string' ? localeCandidate : defaultLocale

    const sanitizedFallback = sanitizeFallbackLocale({
      fallbackLocale,
      locale: req.locale,
      localization,
    })

    req.fallbackLocale = sanitizedFallback
  }

  const i18n =
    req?.i18n ||
    (await getLocalI18n({ config: payload.config, language: payload.config.i18n.fallbackLanguage }))

  if (!req.headers) {
    // @ts-expect-error eslint-disable-next-line no-param-reassign
    req.headers = new Headers()
  }

  req.context = getRequestContext(req, context)
  req.payloadAPI = req?.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.user = user || req?.user || null
  req.payloadDataLoader = req?.payloadDataLoader || getDataLoader(req as PayloadRequest)
  req.routeParams = req?.routeParams || {}
  req.query = req?.query || {}

  attachFakeURLProperties(req)

  return req as PayloadRequest
}
