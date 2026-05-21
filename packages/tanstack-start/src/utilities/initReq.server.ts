import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ImportMap, InitReqResult, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { getRequest } from '@tanstack/react-start/server'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'

import { getRequestLocale } from './getRequestLocale.js'

/**
 * Initializes a Payload request object from the current TanStack Start server context.
 * Uses `getRequest()` from `@tanstack/react-start/server` to access the incoming request.
 */
export async function initReq({
  configPromise,
  importMap,
  overrides,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  overrides?: Parameters<typeof createLocalReq>[0]
}): Promise<InitReqResult> {
  const webRequest = getRequest()
  const headers = new Headers(webRequest.headers)
  const cookies = parseCookies(headers)

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

  const { req: reqOverrides, ...optionsOverrides } = overrides || {}

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host') ?? undefined,
        i18n: i18n as I18n,
        responseHeaders,
        user,
        ...(reqOverrides || {}),
      },
      ...(optionsOverrides || {}),
    },
    payload,
  )

  const locale = await getRequestLocale({ req })

  req.locale = locale?.code

  const permissions = await getAccessResults({ req })

  return {
    cookies,
    headers,
    languageCode,
    locale,
    permissions,
    req,
  }
}
