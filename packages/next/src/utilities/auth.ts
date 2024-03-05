import type { Payload, PayloadRequest } from 'payload/types'

import { getAccessResults, getAuthenticatedUser, parseCookies } from 'payload/auth'
import { cache } from 'react'

export const auth = cache(
  async ({ headers, payload }: { headers: Request['headers']; payload: Payload }) => {
    const cookies = parseCookies(headers)

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
