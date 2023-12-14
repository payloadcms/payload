import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { getAuthenticatedUser } from 'payload/auth'
import { SanitizedConfig } from 'payload/types'
import { cache } from 'react'

const getPermissions = ({
  user,
  payload,
  headers,
  searchParams,
}: {
  user: any
  payload: any
  headers: any
  searchParams: any
}) => {}

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

    const permissions = await getPermissions({
      user,
      payload,
      searchParams,
      headers,
    })

    return {
      user,
      permissions,
    }
  },
)
