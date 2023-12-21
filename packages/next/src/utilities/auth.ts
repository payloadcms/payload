import { getPayload } from 'payload'
import { getAuthenticatedUser, getAccessResults } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import { cache } from 'react'

export const auth = cache(
  async ({ headers, config }: { headers: any; config: Promise<SanitizedConfig> }) => {
    const payload = await getPayload({ config })

    const user = await getAuthenticatedUser({
      headers,
      payload,
    })

    const permissions = await getAccessResults({
      req: {
        user,
        payload,
        context: {},
        payloadAPI: 'REST',
        headers,
        i18n: undefined,
        t: undefined,
      },
    })

    return {
      user,
      permissions,
    }
  },
)
