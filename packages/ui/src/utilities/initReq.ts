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

  const partialResult = await partialReqCache.get(async () => {
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
  }, 'global')

  return reqCache
    .get(async () => {
      const { i18n, languageCode, payload, responseHeaders, user } = partialResult

      const { req: reqOverrides, ...optionsOverrides } = overrides || {}

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

      const locale = await getRequestLocale({
        req,
      })

      req.locale = locale?.code

      const permissions = await getAccessResults({
        req,
      })

      return {
        cookies,
        headers,
        languageCode,
        locale,
        permissions,
        req,
      }
    }, key)
    .then((result) => {
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
