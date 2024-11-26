import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ConfigImport, PayloadRequest, SanitizedPermissions, User } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { headers as getHeaders } from 'next/headers.js'
import { createLocalReq, getConfig, getPayload, parseCookies } from 'payload'
import { cache } from 'react'

import { getRequestLanguage } from './getRequestLanguage.js'

type Result = {
  i18n: I18nClient
  permissions: SanitizedPermissions
  req: PayloadRequest
  user: User
}

export const initReq = cache(async function (configImport: ConfigImport): Promise<Result> {
  const config = await getConfig(configImport)

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

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host'),
        i18n: i18n as I18n,
        url: `${payload.config.serverURL}`,
      },
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
