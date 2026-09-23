import type { I18n, I18nClient } from '@payloadcms/translations'

import { initI18n } from '@payloadcms/translations'
import * as qs from 'qs-esm'

import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { CreatePayloadReqArgs } from '../utilities/createPayloadReq.js'
import type { ServerAdapter } from './adapters/server.js'
import type { GetAdminContextResult } from './functions/index.js'

import { applyUserReadAccess } from '../auth/applyUserReadAccess.js'
import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getAccessResults } from '../auth/getAccessResults.js'
import { getPayload } from '../index.js'
import { createPayloadReq } from '../utilities/createPayloadReq.js'
import { getRequestLanguage } from '../utilities/getRequestLanguage.js'
import { parseCookies } from '../utilities/parseCookies.js'
import { getRequestLocale } from './getRequestLocale.js'

export type PartialAdminContext = {
  i18n: I18nClient
} & Pick<GetAdminContextResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

/** Framework-provided request-scoped caching hooks used to deduplicate admin context creation. */
export type AdminContextCache = {
  /** Reuses locale preference resolution across admin contexts. */
  getLocale?: (
    resolveLocale: () => Promise<Pick<GetAdminContextResult, 'locale'>>,
    ...cacheArgs: unknown[]
  ) => Promise<Pick<GetAdminContextResult, 'locale'>>
  /** Reuses Payload, i18n, and authentication state within the current request. */
  getPartial: (
    createPartialContext: () => Promise<PartialAdminContext>,
  ) => Promise<PartialAdminContext>
  /** Reuses a complete admin context for the supplied key and cache arguments. */
  getRequest: (
    createContext: () => Promise<GetAdminContextResult>,
    key: string,
    ...cacheArgs: unknown[]
  ) => Promise<GetAdminContextResult>
}

export type GetAdminContextArgs = {
  /**
   * Optional framework-owned request-scoped cache.
   * Framework adapters control its lifetime to prevent request state from leaking between requests.
   */
  cache?: AdminContextCache
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  /** Identifies the complete admin context within `cache`; required when a cache is supplied. */
  key?: string
  overrides?: Omit<CreatePayloadReqArgs, 'payload'>
  requestURL?: string
  serverAdapter: ServerAdapter
}

/**
 * Gets the request context used by framework adapters to render the admin panel.
 */
export async function getAdminContext({
  cache,
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides,
  requestURL,
  serverAdapter,
}: GetAdminContextArgs): Promise<GetAdminContextResult> {
  if (cache && !key) {
    throw new Error('getAdminContext requires a key when cache is provided')
  }

  const headers = await serverAdapter.getHeaders()
  const cookies = parseCookies(headers)

  const createPartialContext = async (): Promise<PartialAdminContext> => {
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

  const partialContext = cache
    ? await cache.getPartial(createPartialContext)
    : await createPartialContext()

  const createContext = async (): Promise<GetAdminContextResult> => {
    const { i18n, languageCode, payload, responseHeaders, user } = partialContext
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

    const resolveLocale = async (): Promise<Pick<GetAdminContextResult, 'locale'>> => ({
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
    ? await cache.getRequest(createContext, key!, overrides)
    : await createContext()

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
