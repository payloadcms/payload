import type { Payload, RequestContext, TypedLocale, User } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getDataLoader } from '../collections/dataloader.js'
import { getLocalI18n } from '../translations/getLocalI18n.js'
import { isolateObjectProperty } from './isolateObjectProperty.js'
import { sanitizeFallbackLocale } from './sanitizeFallbackLocale.js'

function getRequestContext(
  req: Partial<PayloadRequest> = { context: null } as unknown as PayloadRequest,
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

const attachFakeURLProperties = (req: Partial<PayloadRequest>, urlSuffix?: string) => {
  /**
   * *NOTE*
   * If no URL is provided, the local API was called outside
   * the context of a request. Therefore we create a fake URL object.
   * `ts-expect-error` is used below for properties that are 'read-only'.
   * Since they do not exist yet we can safely ignore the error.
   */
  let urlObject: undefined | URL

  function getURLObject() {
    if (urlObject) {
      return urlObject
    }

    const fallbackURL = `http://${req.host || 'localhost'}${urlSuffix || ''}`

    const urlToUse =
      req?.url ||
      (req.payload?.config?.serverURL
        ? `${req.payload?.config.serverURL}${urlSuffix || ''}`
        : fallbackURL)

    try {
      urlObject = new URL(urlToUse)
    } catch (_err) {
      req.payload?.logger.error(
        `Failed to create URL object from URL: ${urlToUse}, falling back to ${fallbackURL}`,
      )

      urlObject = new URL(fallbackURL)
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

export type CreateLocalReqOptions = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: false | TypedLocale
  locale?: string
  req?: Partial<PayloadRequest>
  urlSuffix?: string
  user?: User
}

type CreateLocalReq = (options: CreateLocalReqOptions, payload: Payload) => Promise<PayloadRequest>

export const createLocalReq: CreateLocalReq = async (
  {
    context,
    depth,
    fallbackLocale,
    locale: localeArg,
    req = {} as PayloadRequest,
    urlSuffix,
    user,
  },
  payload,
): Promise<PayloadRequest> => {
  // A nested Local API call with an explicit `locale` must not rewrite the
  // caller's req: `beforeChange` merges submitted data into per-locale fields
  // based on `req.locale` after hooks/validation have awaited, so a mutated
  // `req.locale` corrupts the parent operation's data (see #18246). Isolate
  // both locale properties; the nested operation still sees its own locale
  // through the returned request.
  const localReq = isolateObjectProperty(req, ['locale', 'fallbackLocale'])

  const localization = payload.config?.localization

  if (localization) {
    const locale = localeArg === '*' ? 'all' : localeArg
    const defaultLocale = localization.defaultLocale
    const localeCandidate = locale || localReq?.locale || localReq?.query?.locale

    localReq.locale =
      localeCandidate && typeof localeCandidate === 'string' ? localeCandidate : defaultLocale

    const sanitizedFallback = sanitizeFallbackLocale({
      fallbackLocale: fallbackLocale!,
      locale: localReq.locale,
      localization,
    })

    localReq.fallbackLocale = sanitizedFallback!
  }

  const i18n =
    localReq?.i18n ||
    (await getLocalI18n({ config: payload.config, language: payload.config.i18n.fallbackLanguage }))

  if (!localReq.headers) {
    localReq.headers = new Headers()
  }

  localReq.context = getRequestContext(localReq, context)
  localReq.payloadAPI = localReq?.payloadAPI || 'local'
  localReq.payload = payload
  localReq.i18n = i18n
  localReq.t = i18n.t
  localReq.user = user || localReq?.user || null

  // Ensure user.collection is set for auth-related access control
  // TODO (4.0): Instead of silently falling back, throw an error if user.collection is missing
  if (localReq.user && !localReq.user.collection) {
    localReq.user = { ...localReq.user, collection: payload.config.admin.user }
  }

  localReq.payloadDataLoader = localReq?.payloadDataLoader || getDataLoader(localReq as PayloadRequest)
  localReq.routeParams = localReq?.routeParams || {}
  localReq.query = localReq?.query || {}

  if (typeof depth !== 'undefined') {
    localReq.query.depth = depth
  }

  attachFakeURLProperties(localReq, urlSuffix)

  return localReq as PayloadRequest
}
