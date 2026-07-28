import type { MaybePromise, SanitizedConfig, ServerAdapter } from 'payload'

import { createLocalReq, getPayload, logoutOperation } from 'payload'

import { clearAuthCookie } from './cookies.js'

export type LogoutArgs = {
  allSessions?: boolean
  config: MaybePromise<SanitizedConfig>
  serverAdapter: ServerAdapter
}

/**
 * Logs the current user out and expires the auth cookie through the supplied
 * `serverAdapter`, so the function is framework-agnostic; each adapter binds its own.
 */
export async function logout({
  allSessions = false,
  config,
  serverAdapter,
}: LogoutArgs): Promise<{ message: string; success: boolean }> {
  const payload = await getPayload({ config, cron: true })
  const headers = await serverAdapter.getHeaders()
  const authResult = await payload.auth({ headers })

  if (!authResult.user) {
    return { message: 'User already logged out', success: true }
  }

  const { user } = authResult
  const req = await createLocalReq({ user }, payload)
  const collection = payload.collections[user.collection]

  if (!collection) {
    return { message: 'Collection not found', success: false }
  }

  const logoutResult = await logoutOperation({
    allSessions,
    collection,
    req,
  })

  if (!logoutResult) {
    return { message: 'Logout failed', success: false }
  }

  if (collection.config.auth) {
    await clearAuthCookie({
      authConfig: collection.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      serverAdapter,
    })
  }

  return { message: 'User logged out successfully', success: true }
}
