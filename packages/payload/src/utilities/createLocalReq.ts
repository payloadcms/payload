import type { Payload, RequestContext, TypedLocale, User } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { peekResolvedBranch, resetBranchState } from '../branching/resolveBranch.js'
import { MAIN_BRANCH } from '../branching/types.js'
import { getDataLoader } from '../collections/dataloader.js'
import { getLocalI18n } from '../translations/getLocalI18n.js'
import { sanitizeFallbackLocale } from '../utilities/sanitizeFallbackLocale.js'
import { isolateObjectProperty } from './isolateObjectProperty.js'

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
  /**
   * Read and write against this branch instead of the request's own.
   * `false` bypasses branching entirely.
   */
  branch?: false | string
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
    branch,
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

  if (branch !== undefined) {
    // An explicit branch wins over whatever the request was doing — the same contract
    // `locale` has. When the request has *already* resolved a different branch, saying so
    // is not enough: branch state (the change manifest, the resolved slug) is memoized on
    // the request, and a later read would keep answering for the branch that got there
    // first. So the operation runs on an isolated request instead, which leaves the
    // caller's own request untouched.
    //
    // Isolated rather than reset in place because the caller still owns their request: a
    // diff view reading one document on two branches, or a merge writing to main from
    // inside a branch-scoped HTTP request, must not have its request rewritten underneath
    // it.
    const target = branch === false ? MAIN_BRANCH : branch
    // What the request is already doing, whether it has read anything yet or not: a branch
    // it resolved, or one set on it and not yet used. A request that has committed to
    // neither is simply pointed at the branch — the same thing `locale` does.
    const current =
      peekResolvedBranch(req) ?? (typeof req.branch === 'string' ? req.branch : undefined)

    if (current !== undefined && current !== target) {
      req = isolateObjectProperty(req, ['branch', 'context'])
      req.context = { ...req.context }
      resetBranchState(req as PayloadRequest)
    }

    // Set before anything resolves it, so this wins over header and cookie.
    // `false` means "bypass branching", carried as an explicit sentinel rather
    // than `undefined` so it survives resolution.
    req.branch = branch === false ? undefined : branch
    ;(req.context as Record<string, unknown>)._branchBypass = branch === false
  }

  req.payloadAPI = req?.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.user = user || req?.user || null

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
