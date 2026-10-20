import type { Payload, RequestContext, TypedLocale, User } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { getDataLoader } from '../collections/dataloader.js'
import { getLocalI18n } from '../translations/getLocalI18n.js'
import { sanitizeFallbackLocale } from '../utilities/sanitizeFallbackLocale.js'

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

/**
 * Properties of the request that belong to the operation being built, not to the
 * caller that passed its `req` in: the operation's `locale`, `fallbackLocale`
 * and the `depth` inside `query`.
 *
 * Shared between nested operations.
 */
const requestScopeProperties = ['locale', 'fallbackLocale', 'query'] as const

/**
 * Returns a request view over `req` that reads and writes the operation scoped
 * properties against a delegate, leaving the underlying object untouched.
 *
 * see https://github.com/payloadcms/payload/issues/18844
 */
function scopeRequestProperties<T extends object>(req: T, properties: (keyof T)[]): T {
  const delegate = {} as Record<PropertyKey, unknown>
  const boundMethods = new Map<
    PropertyKey,
    { bound: (...args: unknown[]) => unknown; source: unknown }
  >()

  for (const property of properties) {
    if (property in req) {
      const value = req[property]

      // Objects with a plain prototype are shallow-copied so that a write into
      // a nested value (like `req.query.depth = …`) lands on the operation's
      // copy instead of mutating the caller's object. Anything else — a class
      // instance such as a URLSearchParams, an array — is shared by reference,
      // as it was before this helper existed, because a spread would silently
      // strip it (a spread of a URLSearchParams yields `{}`).
      const isPlainObject =
        value !== null &&
        (typeof value === 'object' || typeof value === 'function') &&
        (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

      delegate[property] = isPlainObject ? { ...value } : value
    }
  }

  const isScoped = (property: PropertyKey) => properties.includes(property as keyof T)

  return new Proxy(req, {
    deleteProperty(target, property) {
      return Reflect.deleteProperty(isScoped(property) ? delegate : target, property)
    },
    get(target, property, _receiver) {
      if (isScoped(property)) {
        return delegate[property]
      }

      const value = Reflect.get(target, property, target)

      // `constructor` is never called as a method, so it is returned as it is.
      // Binding it would change the identity of the request's prototype: a
      // bound constructor is a different function object, so `req.constructor`
      // would no longer be `Object`, and a structural comparison of two objects
      // compares their constructors before it compares their values.
      if (typeof value !== 'function' || property === 'constructor') {
        return value
      }

      // Methods must keep the underlying object as their receiver: web Request
      // methods brand-check `this` against their private fields (#state), which
      // the proxy cannot satisfy itself. `addDataAndFileToRequest` calls
      // `req.text?.()` on the request this helper returns, so the bound
      // receiver is what keeps the REST and GraphQL body parsing working.
      //
      // The bound method is cached, so that reading the same method twice
      // returns the same function, the way it does on an ordinary object. A
      // comparison of two requests compares their function properties by
      // reference, so a fresh bound function on every read made a request
      // unequal to a plain copy of itself. The cache remembers the function it
      // wraps, so that replacing a method on the request is still visible.
      const cached = boundMethods.get(property)

      if (cached && cached.source === value) {
        return cached.bound
      }

      const bound = value.bind(target)

      boundMethods.set(property, { bound, source: value })

      return bound
    },
    getOwnPropertyDescriptor(target, property) {
      if (!isScoped(property) || property in target) {
        return Reflect.getOwnPropertyDescriptor(target, property)
      }

      return Reflect.getOwnPropertyDescriptor(delegate, property)
    },
    has(target, property) {
      return isScoped(property) ? property in delegate : Reflect.has(target, property)
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)

      for (const property of properties) {
        if (!(property in target) && property in delegate) {
          keys.push(property)
        }
      }

      return keys
    },
    set(target, property, newValue, _receiver) {
      if (isScoped(property)) {
        delegate[property] = newValue
        return true
      }

      return Reflect.set(target, property, newValue, target)
    },
  })
}

export type CreatePayloadRequestArgs = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: false | TypedLocale
  locale?: string
  payload: Payload
  req?: Partial<PayloadRequest>
  urlSuffix?: string
  user?: null | User
}

type CreatePayloadRequest = (args: CreatePayloadRequestArgs) => Promise<PayloadRequest>

export const createPayloadRequest: CreatePayloadRequest = async ({
  context,
  depth,
  fallbackLocale,
  locale: localeArg,
  payload,
  req: incomingReq = {},
  urlSuffix,
  user,
}): Promise<PayloadRequest> => {
  const req = scopeRequestProperties(incomingReq, [...requestScopeProperties])
  const localization = payload.config?.localization

  if (localization) {
    const locale = localeArg === '*' ? 'all' : localeArg
    const defaultLocale = localization.defaultLocale
    const localeCandidate = locale || req?.locale || req?.query?.locale

    req.locale =
      localeCandidate && typeof localeCandidate === 'string' ? localeCandidate : defaultLocale

    const sanitizedFallback = sanitizeFallbackLocale({
      fallbackLocale: fallbackLocale!,
      locale: req.locale,
      localization,
    })

    req.fallbackLocale = sanitizedFallback!
  }

  const i18n =
    req?.i18n ||
    (await getLocalI18n({ config: payload.config, language: payload.config.i18n.fallbackLanguage }))

  if (!req.headers) {
    req.headers = new Headers()
  }

  req.context = getRequestContext(req, context)
  req.payloadAPI = req?.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.user = user === undefined ? (req?.user ?? null) : user

  // Ensure user.collection is set for auth-related access control
  // TODO (4.0): Instead of silently falling back, throw an error if user.collection is missing
  if (req.user && !req.user.collection) {
    req.user = { ...req.user, collection: payload.config.admin.user }
  }

  req.payloadDataLoader = req?.payloadDataLoader || getDataLoader(req as PayloadRequest)
  req.routeParams = req?.routeParams || {}
  req.query = req?.query || {}

  if (typeof depth !== 'undefined') {
    req.query.depth = depth
  }

  attachFakeURLProperties(req, urlSuffix)

  return req as PayloadRequest
}
