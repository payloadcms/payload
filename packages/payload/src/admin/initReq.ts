import type { I18n, I18nClient } from '@payloadcms/translations'

import { initI18n } from '@payloadcms/translations'
import * as qs from 'qs-esm'

import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { ServerAdapter } from './adapters/server.js'
import type { InitReqResult } from './functions/index.js'

import { applyUserReadAccess } from '../auth/applyUserReadAccess.js'
import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getAccessResults } from '../auth/getAccessResults.js'
import { getPayload } from '../index.js'
import { createPayloadReq } from '../utilities/createPayloadReq.js'
import { getRequestLanguage } from '../utilities/getRequestLanguage.js'
import { parseCookies } from '../utilities/parseCookies.js'
import { getRequestLocale } from './getRequestLocale.js'

export type InitReqPartialResult = {
  i18n: I18nClient
} & Pick<InitReqResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

/** Framework-provided request-scoped caching hooks used to deduplicate request initialization. */
export type InitReqCache = {
  /** Reuses locale preference resolution across request results. */
  getLocale?: (
    resolveLocale: () => Promise<Pick<InitReqResult, 'locale'>>,
    ...cacheArgs: unknown[]
  ) => Promise<Pick<InitReqResult, 'locale'>>
  /** Reuses Payload, i18n, and authentication state within the current request. */
  getPartial: (
    createPartialResult: () => Promise<InitReqPartialResult>,
  ) => Promise<InitReqPartialResult>
  /** Reuses a complete initialized request for the supplied key and cache arguments. */
  getRequest: (
    createRequestResult: () => Promise<InitReqResult>,
    key: string,
    ...cacheArgs: unknown[]
  ) => Promise<InitReqResult>
}

export type InitReqArgs = {
  /**
   * Optional framework-owned request-scoped cache.
   * Framework adapters control its lifetime to prevent request state from leaking between requests.
   */
  cache?: InitReqCache
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  /** Identifies the complete request result within `cache`; required when a cache is supplied. */
  key?: string
  overrides?: Omit<Parameters<typeof createPayloadReq>[0], 'payload'>
  requestURL?: string
  serverAdapter: ServerAdapter
}

/**
 * Initializes the request state used by framework adapters to render the admin panel.
 */
export async function initReq({
  cache,
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides,
  requestURL,
  serverAdapter,
}: InitReqArgs): Promise<InitReqResult> {
  if (cache && !key) {
    throw new Error('initReq requires a key when cache is provided')
  }

  const headers = await serverAdapter.getHeaders()
  const cookies = parseCookies(headers)

  const createPartialResult = async (): Promise<InitReqPartialResult> => {
    const config = await configPromise
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({
      config,
      cookies,
      headers,
    })

    const i18n = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode,
    })

    const { responseHeaders, user } = await executeAuthStrategies({
      canSetHeaders,
      headers,
      payload,
    })

    return {
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user,
    }
  }

  const partialResult = cache
    ? await cache.getPartial(createPartialResult)
    : await createPartialResult()

  const createRequestResult = async (): Promise<InitReqResult> => {
    const { i18n, languageCode, payload, responseHeaders, user } = partialResult
    const { req: reqOverrides, ...optionsOverrides } = overrides || {}
    const hasOptionsUserOverride = Object.hasOwn(optionsOverrides, 'user')
    const hasReqUserOverride = Object.hasOwn(reqOverrides ?? {}, 'user')
    const hasUserOverride = hasOptionsUserOverride || hasReqUserOverride
    const userOverride = hasOptionsUserOverride ? optionsOverrides.user : reqOverrides?.user
    const requestDefaults = getRequestDefaults({ requestURL })

    const req = await createPayloadReq({
      req: {
        headers,
        host: headers.get('host') ?? undefined,
        i18n: i18n as I18n,
        responseHeaders,
        server: serverAdapter,
        user,
        ...requestDefaults,
        ...(reqOverrides || {}),
      },
      ...(optionsOverrides || {}),
      payload,
    })

    if (hasUserOverride && userOverride == null) {
      req.user = null
    }

    const resolveLocale = async (): Promise<Pick<InitReqResult, 'locale'>> => ({
      locale: await getRequestLocale({ req }),
    })
    const { locale } = cache?.getLocale
      ? await cache.getLocale(
          resolveLocale,
          payload,
          req.user?.collection,
          req.user?.id,
          req.query.locale,
        )
      : await resolveLocale()

    req.locale = locale?.code

    let userWithReadAccess = req.user

    if (!hasUserOverride && req.user) {
      try {
        const collectionSlug = req.user.collection ?? payload.config.admin.user
        const collection = payload.collections[collectionSlug]?.config

        if (!collection?.auth) {
          throw new Error('Authenticated user collection not found')
        }

        userWithReadAccess = await applyUserReadAccess({
          collection,
          depth: collection.auth.depth,
          overrideAccess: false,
          req,
          showHiddenFields: false,
          user: req.user,
        })
      } catch (error) {
        payload.logger.error({ err: error })
        req.user = null
        userWithReadAccess = null
      }
    }

    const permissions = await getAccessResults({ req })

    return {
      cookies,
      headers,
      languageCode,
      locale,
      permissions,
      req,
      user: userWithReadAccess,
    }
  }

  const result = cache
    ? await cache.getRequest(createRequestResult, key!, overrides)
    : await createRequestResult()

  return {
    ...result,
    req: {
      ...result.req,
      ...(result.req.context
        ? {
            context: { ...result.req.context },
          }
        : {}),
    },
  }
}

function getRequestDefaults({
  requestURL,
}: {
  requestURL?: string
}): Partial<Pick<PayloadRequest, 'query' | 'url'>> {
  if (!requestURL) {
    return {}
  }

  try {
    const url = new URL(requestURL)

    return {
      ...(url.search
        ? {
            query: qs.parse(url.search, {
              depth: 10,
              ignoreQueryPrefix: true,
            }) as PayloadRequest['query'],
          }
        : {}),
      url: requestURL,
    }
  } catch {
    return {}
  }
}
