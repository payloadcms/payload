import type { AcceptedLanguages, I18n, I18nClient } from '@payloadcms/translations'
import type {
  ImportMap,
  Locale,
  Payload,
  PayloadRequest,
  SanitizedConfig,
  SanitizedPermissions,
  User,
} from 'payload'

import { initI18n } from '@payloadcms/translations'
import { headers as getHeaders } from 'next/headers.js'
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

type Result = {
  cookies: Map<string, string>
  headers: Awaited<ReturnType<typeof getHeaders>>
  languageCode: AcceptedLanguages
  locale?: Locale
  permissions: SanitizedPermissions
  req: PayloadRequest
}

type PartialResult = {
  i18n: I18nClient
  languageCode: AcceptedLanguages
  payload: Payload
  responseHeaders: Headers
  user: null | User
}

// Create cache instances for different parts of our application
const partialReqCache = selectiveCache<PartialResult>('partialReq')
const reqCache = selectiveCache<Result>('req')

/**
 * Initializes a full request object, including the `req` object and access control.
 * As access control and getting the request locale is dependent on the current URL and
 */
export const initReq = async function ({
  configPromise,
  importMap,
  key,
  overrides,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Parameters<typeof createLocalReq>[0]
}): Promise<Result> {
  const headers = await getHeaders()
  const cookies = parseCookies(headers)

  const partialResult = await partialReqCache.get(async () => {
    const config = await configPromise
    const payload = await getPayload({ config, importMap })
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

  return reqCache.get(async () => {
    const { i18n, languageCode, payload, responseHeaders, user } = partialResult

    const { req: reqOverrides, ...optionsOverrides } = overrides || {}

    const req = await createLocalReq(
      {
        req: {
          headers,
          host: headers.get('host'),
          i18n: i18n as I18n,
          responseHeaders,
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
}
