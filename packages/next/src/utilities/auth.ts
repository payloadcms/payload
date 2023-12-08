import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { getAuthenticatedUser } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import { cache } from 'react'

const getPermissions = ({ user, payload }: { user: any; payload: any }) => {}

export const auth = cache(
  async ({
    headers,
    cookies,
    searchParams,
    config,
    unauthorizedRedirect = true,
  }: {
    headers: any
    cookies: any
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

    const permissions = await getPermissions({
      user,
      payload,
    })

    return {
      user,
      permissions,
    }
  },
)
