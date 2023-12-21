import { headers as getHeaders } from 'next/headers'

import { auth } from './auth'

import { getPayload } from 'payload'
import type { SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'

export const initPage = async (
  configPromise: Promise<SanitizedConfig>,
  redirectUnauthenticatedUser = true,
): Promise<{
  payload: Awaited<ReturnType<typeof getPayload>>
  permissions: Awaited<ReturnType<typeof auth>>['permissions']
  user: Awaited<ReturnType<typeof auth>>['user']
  config: SanitizedConfig
}> => {
  const headers = getHeaders()

  const { permissions, user } = await auth({
    headers,
    config: configPromise,
  })

  const config = await configPromise

  if (redirectUnauthenticatedUser && !user) {
    // `redirect(`${payload.config.routes.admin}/unauthorized`)` is not built yet
    redirect(`${config.routes.admin}/login`)
  }

  const payload = await getPayload({
    config: configPromise,
  })

  return {
    payload,
    permissions,
    user,
    config,
  }
}
