import type { I18nClient } from '@payloadcms/translations'
import type { PayloadRequest, Permissions, SanitizedConfig, User } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { headers as getHeaders } from 'next/headers.js'
import { createLocalReq, parseCookies } from 'payload'
import { cache } from 'react'

import { getPayloadHMR } from './getPayloadHMR.js'
import { getRequestLanguage } from './getRequestLanguage.js'

type Result = {
  i18n: I18nClient
  permissions: Permissions
  req: PayloadRequest
  user: User
}

export const initReq = cache(async function (config: SanitizedConfig): Promise<Result> {
  const payload = await getPayloadHMR({ config })

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

  const req = await createLocalReq(
    {
      fallbackLocale: 'null',
      req: {
        headers,
        host: headers.get('host'),
        i18n,
        url: `${payload.config.serverURL}`,
      } as PayloadRequest,
    },
    payload,
  )

  const { permissions, user } = await payload.auth({ headers, req })

  return {
    i18n,
    permissions,
    req,
    user,
  }
})
