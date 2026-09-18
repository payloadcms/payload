import type { I18n, I18nClient } from '@payloadcms/translations'
import type {
  ImportMap,
  InitReqResult,
  PayloadRequest,
  SanitizedConfig,
  ServerAdapter,
} from 'payload'

import { initI18n } from '@payloadcms/translations'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'
import { applyUserReadAccess } from 'payload/internal'

import { getRequestLocale } from './getRequestLocale.js'
import { selectiveCache } from './selectiveCache.js'

type PartialResult = {
  i18n: I18nClient
} & Pick<InitReqResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

const partialReqCache = selectiveCache<PartialResult>('partialReq')
const reqCache = selectiveCache<InitReqResult>('req')

/**
 * Initializes a full request object, including the `req` object and access control.
 * Reads headers/cookies through the supplied `serverAdapter` so the function is
 * framework-agnostic; the consuming framework wires its own adapter.
 */
export const initReq = async function ({
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides,
  serverAdapter,
}: {
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Parameters<typeof createLocalReq>[0]
  serverAdapter: ServerAdapter
}): Promise<InitReqResult> {
  const headers = await serverAdapter.getHeaders()
  const cookies = parseCookies(headers)

  const getPartialResult = async () => {
    const config = await configPromise
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({
      config,
      cookies,
      headers,
    })

    const i18n: I18nClient = await initI18n({
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

  const partialResult = await partialReqCache.get(getPartialResult, 'global')

  const getResult = async () => {
    const { i18n, languageCode, payload, responseHeaders, user } = partialResult

    const { req: reqOverrides, ...optionsOverrides } = overrides || {}
    const hasOptionsUserOverride = Object.hasOwn(optionsOverrides, 'user')
    const hasReqUserOverride = Object.hasOwn(reqOverrides ?? {}, 'user')
    const hasUserOverride = hasOptionsUserOverride || hasReqUserOverride
    const userOverride = hasOptionsUserOverride ? optionsOverrides.user : reqOverrides?.user

    const req = await createLocalReq(
      {
        req: {
          headers,
          host: headers.get('host'),
          i18n: i18n as I18n,
          responseHeaders,
          server: serverAdapter,
          user,
          ...(reqOverrides || {}),
        },
        ...(optionsOverrides || {}),
      },
      payload,
    )

    if (hasUserOverride && userOverride == null) {
      req.user = null
    }

    let userWithReadAccess = req.user

    const locale = await getRequestLocale({ req })
    req.locale = locale?.code

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

  return reqCache.get(getResult, key, overrides).then((result) => {
    // Shallow-copy req before returning to prevent
    // mutations from propagating to the cached req object.
    // This ensures parallel operations using the same cache key don't affect each other.
    return {
      ...result,
      req: {
        ...result.req,
        ...(result.req?.context
          ? {
              context: { ...result.req.context },
            }
          : {}),
      },
    }
  })
}
