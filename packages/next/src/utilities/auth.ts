import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { getAuthenticatedUser, getAccessResults } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import { cache } from 'react'

export const auth = cache(
  async ({
    headers,
    searchParams,
    config,
    unauthorizedRedirect = true,
  }: {
    headers: any
    searchParams: any
    config: Promise<SanitizedConfig>
    unauthorizedRedirect?: boolean
  }) => {
    const payload = await getPayload({ config })

    const user = await getAuthenticatedUser({
      headers,
      searchParams,
      payload,
    })

    if (unauthorizedRedirect && !user) {
      redirect(`${payload.config.routes.admin}/unauthorized`)
    }

    const permissions = await getAccessResults({
      searchParams,
      req: {
        user,
        payload,
      },
    })

    return {
      user,
      permissions,
    }
  },
)
