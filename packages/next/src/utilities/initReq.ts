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

type PartialResult = {
  cookies: Map<string, string>
  headers: Awaited<ReturnType<typeof getHeaders>>
  i18n: I18nClient
  languageCode: AcceptedLanguages
  payload: Payload
  responseHeaders: Headers
  user: null | User
}

const getPartialInitReqContainer = cache(function (): {
  reqResult: false | PartialResult | Promise<PartialResult>
} {
  return {
    reqResult: false,
  }
})

const getInitReqContainer = cache(function (key: string): {
  reqResult: false | Promise<Result> | Result
} {
  return {
    reqResult: false,
  }
})

const initPartialReq = async function ({
  configPromise,
  importMap,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
}): Promise<PartialResult> {
  const partialReqContainer = getPartialInitReqContainer()

  if (
    partialReqContainer?.reqResult &&
    'then' in partialReqContainer?.reqResult &&
    typeof partialReqContainer?.reqResult?.then === 'function'
  ) {
    return await partialReqContainer.reqResult
  }

  partialReqContainer.reqResult = (async () => {
    const config = await configPromise
    const payload = await getPayload({ config, importMap })

    const headers = await getHeaders()
    const cookies = parseCookies(headers)

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

    /**
     * Cannot simply call `payload.auth` here, as we need the user to get the locale, and we need the locale to get the access results
     * I.e. the `payload.auth` function would call `getAccessResults` without a fully-formed `req` object
     */
    const { responseHeaders, user } = await executeAuthStrategies({
      headers,
      payload,
    })

    const result: PartialResult = {
      cookies,
      headers,
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user,
    }

    return result
  })()

  partialReqContainer.reqResult = await partialReqContainer.reqResult

  return partialReqContainer.reqResult
}

export const initReq = async function ({
  configPromise,
  importMap,
  key,
  overrides,
  urlSuffix,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Parameters<typeof createLocalReq>[0]
  urlSuffix?: string
}): Promise<Result> {
  const { cookies, headers, i18n, languageCode, payload, responseHeaders, user } =
    await initPartialReq({
      configPromise,
      importMap,
    })

  const reqContainer = getInitReqContainer(key)

  if (
    reqContainer?.reqResult &&
    'then' in reqContainer?.reqResult &&
    typeof reqContainer?.reqResult?.then === 'function'
  ) {
    return await reqContainer.reqResult
  }

  reqContainer.reqResult = (async () => {
    const { req: reqOverrides, ...optionsOverrides } = overrides || {}

    const req = await createLocalReq(
      {
        req: {
          headers,
          host: headers.get('host'),
          i18n: i18n as I18n,
          responseHeaders,
          url: `${payload.config.serverURL}${urlSuffix || ''}`,
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

    const result: Result = {
      cookies,
      headers,
      languageCode,
      locale,
      permissions,
      req,
    }

    return result
  })()

  reqContainer.reqResult = await reqContainer.reqResult

  return reqContainer.reqResult
}
