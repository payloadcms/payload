import type { SanitizedConfig } from 'payload/types'

import { getPayload } from 'payload'
import { getAccessResults, getAuthenticatedUser } from 'payload/auth'
import { cache } from 'react'

export const auth = cache(
  async ({
    config,
    cookies,
    headers,
  }: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    cookies: Map<string, string>
    headers: any
  }) => {
    const payload = await getPayload({ config })

    const user = await getAuthenticatedUser({
      cookies,
      headers,
      payload,
    })

    const permissions = await getAccessResults({
      req: {
        context: {},
        headers,
        i18n: undefined,
        payload,
        payloadAPI: 'REST',
        t: undefined,
        user,
      },
    })

    return {
      permissions,
      user,
    }
  },
)
