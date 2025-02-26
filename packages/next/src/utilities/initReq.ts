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
import * as qs from 'qs-esm'
import { cache } from 'react'

import { getRequestLocale } from './getRequestLocale.js'

type Result = {
  cookies: Map<string, string>
  headers: Awaited<ReturnType<typeof getHeaders>>
  languageCode: AcceptedLanguages
  locale?: Locale
  permissions: SanitizedPermissions
  req: PayloadRequest
}
const cachedInitI18n = cache(async (config: SanitizedConfig, languageCode: AcceptedLanguages) => {
  return await initI18n({
    config: config.i18n,
    context: 'client',
    language: languageCode,
  })
})

const cachedExecuteAuthStrategies = cache(
  async (headers: Awaited<ReturnType<typeof getHeaders>>, payload: Payload) => {
    return await executeAuthStrategies({
      headers,
      payload,
    })
  },
)

const cachedCreateLocalReq = cache(
  async (
    fallbackLocale: false | string,
    headers: Awaited<ReturnType<typeof getHeaders>>,
    i18n: I18n,
    queryString: string | undefined,
    responseHeaders: Headers,
    url: string,
    user: null | User,
    payload: Payload,
  ) => {
    return await createLocalReq(
      {
        fallbackLocale,
        req: {
          headers,
          host: headers.get('host'),
          i18n,
          query: queryString
            ? qs.parse(queryString, {
                depth: 10,
                ignoreQueryPrefix: true,
              })
            : undefined,
          responseHeaders,
          url,
          user,
        },
      },
      payload,
    )
  },
)

const cachedGetRequestLocale = cache(async (req: PayloadRequest) => {
  return await getRequestLocale({
    req,
  })
})

const cachedGetAccessResults = cache(async (req: PayloadRequest) => {
  return await getAccessResults({
    req,
  })
})

/**
 * Initializes a full request object, including the `req` object and access control.
 * As access control and getting the request locale is dependent on the current URL and
 */
export const initReq = async function ({
  configPromise,
  importMap,
  overrides,
  urlSuffix,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  overrides?: {
    fallbackLocale?: false | string
    queryString?: string
  }
  urlSuffix?: string
}): Promise<Result> {
  const headers = await getHeaders()
  const cookies = parseCookies(headers)

  const config = await configPromise
  const payload = await getPayload({ config, importMap })
  const languageCode = getRequestLanguage({
    config,
    cookies,
    headers,
  })

  const i18n: I18nClient = await cachedInitI18n(config, languageCode)

  const { responseHeaders, user } = await cachedExecuteAuthStrategies(headers, payload)

  const req = await cachedCreateLocalReq(
    overrides?.fallbackLocale,
    headers,
    i18n as I18n,
    overrides?.queryString,
    responseHeaders,
    `${payload.config.serverURL}${urlSuffix || ''}`,
    user,
    payload,
  )

  const locale = await cachedGetRequestLocale(req)
  req.locale = locale?.code

  const permissions = await cachedGetAccessResults(req)

  return {
    cookies,
    headers,
    languageCode,
    locale,
    permissions,
    req,
  }
}
