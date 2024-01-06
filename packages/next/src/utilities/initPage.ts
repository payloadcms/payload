import { headers as getHeaders } from 'next/headers'

import { auth } from './auth'

import { getPayload } from 'payload'
import type { CustomPayloadRequest, SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'
import { parseCookies } from './cookies'
import { getNextI18n } from './getNextI18n'
import { getRequestLanguage } from './getRequestLanguage'

export const initPage = async (
  configPromise: Promise<SanitizedConfig>,
  redirectUnauthenticatedUser?: boolean,
): Promise<{
  payload: Awaited<ReturnType<typeof getPayload>>
  permissions: Awaited<ReturnType<typeof auth>>['permissions']
  user: Awaited<ReturnType<typeof auth>>['user']
  config: SanitizedConfig
  i18n: CustomPayloadRequest['i18n']
}> => {
  const headers = getHeaders()
  const cookies = parseCookies(headers)

  const { permissions, user } = await auth({
    headers,
    config: configPromise,
    cookies,
  })
  const language = getRequestLanguage({ cookies, headers })

  const config = await configPromise

  if (redirectUnauthenticatedUser && !user) {
    // `redirect(`${payload.config.routes.admin}/unauthorized`)` is not built yet
    redirect(`${config.routes.admin}/login`)
  }

  const payload = await getPayload({
    config: configPromise,
  })

  const i18n = getNextI18n({ config, language })

  return {
    payload,
    permissions,
    user,
    config,
    i18n,
  }
}
