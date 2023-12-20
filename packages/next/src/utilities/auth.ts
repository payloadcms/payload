import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { getAuthenticatedUser, getAccessResults } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import { cache } from 'react'

export const auth = cache(
  async ({
    headers,
    config,
    unauthorizedRedirect = true,
  }: {
    headers: any
    config: Promise<SanitizedConfig>
    unauthorizedRedirect?: boolean
  }) => {
    const payload = await getPayload({ config })

    const user = await getAuthenticatedUser({
      headers,
      payload,
    })

    if (unauthorizedRedirect && !user) {
      // TODO: revert to: `redirect(`${payload.config.routes.admin}/unauthorized`)`
      // once unauthorized page is built out
      redirect(`${payload.config.routes.admin}/login`)
    }

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
