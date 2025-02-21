import type { I18n, I18nClient } from '@payloadcms/translations'
import type { Locale, PayloadRequest, SanitizedConfig, SanitizedPermissions } from 'payload'

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
  locale?: Locale
  permissions: SanitizedPermissions
  req: PayloadRequest
}

export const getInitReqContainer = cache(function (): {
  reqResult: false | Promise<Result>
} {
  return {
    reqResult: false,
  }
})

export const initReq = async function (
  configPromise: Promise<SanitizedConfig> | SanitizedConfig,
  overrides?: Parameters<typeof createLocalReq>[0],
): Promise<Result> {
  const reqContainer = getInitReqContainer()

  if (reqContainer?.reqResult && typeof reqContainer?.reqResult?.then === 'function') {
    return await reqContainer.reqResult
  }

  reqContainer.reqResult = (async () => {
    const config = await configPromise
    const payload = await getPayload({ config })

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

    const { req: reqOverrides, ...optionsOverrides } = overrides || {}

    const req = await createLocalReq(
      {
        req: {
          headers,
          host: headers.get('host'),
          i18n: i18n as I18n,
          responseHeaders,
          url: `${payload.config.serverURL}`,
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
      locale,
      permissions,
      req,
    }

    return result
  })()

  return await reqContainer.reqResult
}
