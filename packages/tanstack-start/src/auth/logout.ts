import type { MaybePromise, SanitizedConfig } from 'payload'

import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { createLocalReq, getPayload, logoutOperation } from 'payload'

import { getExistingAuthToken } from '../utilities/getExistingAuthToken.js'

type LogoutArgs = {
  allSessions?: boolean
  config: MaybePromise<SanitizedConfig>
}

export const logoutServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: LogoutArgs) => data)
  .handler(async ({ data }) => {
    const { allSessions = false, config } = data

    const payload = await getPayload({ config })
    const request = getRequest()
    const headers = new Headers(request.headers)
    const authResult = await payload.auth({ headers })

    if (!authResult.user) {
      return { message: 'User already logged out', success: true }
    }

    const { user } = authResult
    const req = await createLocalReq({ user }, payload)
    const collection = payload.collections[user.collection]

    const logoutResult = await logoutOperation({
      allSessions,
      collection,
      req,
    })

    if (!logoutResult) {
      return { message: 'Logout failed', success: false }
    }

    const existingCookie = getExistingAuthToken(payload.config.cookiePrefix)
    if (existingCookie) {
      setResponseHeader(
        'Set-Cookie',
        `${encodeURIComponent(existingCookie.name)}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`,
      )
    }

    return { message: 'User logged out successfully', success: true }
  })
