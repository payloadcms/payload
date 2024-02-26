import type { PayloadRequest, SanitizedConfig } from 'payload/types'

import { getPayload } from 'payload'
import { getAccessResults, getAuthenticatedUser, parseCookies } from 'payload/auth'
import { cache } from 'react'

export const auth = cache(
  async ({
    config,
    headers,
  }: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    headers: any
  }) => {
    const cookies = parseCookies(headers)
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
      } as PayloadRequest,
    })

    return {
      cookies,
      permissions,
      user,
    }
  },
)
