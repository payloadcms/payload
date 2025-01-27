import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '../../payload/payload-types'
import { ME_QUERY } from '../_graphql/me'
import { GRAPHQL_API_URL } from './shared'

export const getMe = async (args?: {
  nullUserRedirect?: string
  userRedirect?: string
}): Promise<{
  user: User
  token: string
}> => {
  const { nullUserRedirect, userRedirect } = args || {}
  const cookieStore = cookies()
  const token = cookieStore.get('payload-token')?.value

  const meUserReq = await fetch(`${GRAPHQL_API_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      query: ME_QUERY,
    }),
  })

  const {
    user,
  }: {
    user: User
  } = await meUserReq.json()

  if (userRedirect && meUserReq.ok && user) {
    redirect(userRedirect)
  }

  if (nullUserRedirect && (!meUserReq.ok || !user)) {
    redirect(nullUserRedirect)
  }

  return {
    user,
    token,
  }
}
