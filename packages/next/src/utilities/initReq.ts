import type { I18n, I18nClient } from '@payloadcms/translations'
import type { PayloadRequest, SanitizedConfig, SanitizedPermissions } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { headers as getHeaders } from 'next/headers.js'
import { createLocalReq, getPayload, parseCookies } from 'payload'
import { cache } from 'react'

import { getRequestLanguage } from './getRequestLanguage.js'

type Result = {
  permissions: SanitizedPermissions
  req: PayloadRequest
}

export const initReq = cache(async function (
  configPromise: Promise<SanitizedConfig> | SanitizedConfig,
  overrides: {
    options?: Record<string, unknown>
    req?: Record<string, unknown>
  },
): Promise<Result> {
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

  const { permissions, user } = await payload.auth({ headers })

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host'),
        i18n: i18n as I18n,
        url: `${payload.config.serverURL}`,
        user,
        ...(overrides?.req || {}),
      },
      ...(overrides?.options || {}),
    },
    payload,
  )

  return {
    permissions,
    req,
  }
})
