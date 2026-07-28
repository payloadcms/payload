import type { CollectionSlug, MaybePromise, SanitizedConfig, ServerAdapter } from 'payload'

import { createLocalReq, getPayload, refreshOperation } from 'payload'

import { getExistingAuthToken, setAuthCookie } from './cookies.js'

export type RefreshArgs = {
  config: MaybePromise<SanitizedConfig>
  serverAdapter: ServerAdapter
}

/**
 * Refreshes the current user's auth token and rewrites the cookie through the
 * supplied `serverAdapter`, so the function is framework-agnostic; each adapter
 * binds its own.
 */
export async function refresh({
  config,
  serverAdapter,
}: RefreshArgs): Promise<{ message: string; success: boolean }> {
  const payload = await getPayload({ config, cron: true })
  const headers = await serverAdapter.getHeaders()
  const result = await payload.auth({ headers })

  if (!result.user) {
    throw new Error('Cannot refresh token: user not authenticated')
  }

  const existingCookie = await getExistingAuthToken({
    cookiePrefix: payload.config.cookiePrefix,
    serverAdapter,
  })

  if (!existingCookie) {
    return { message: 'No valid token found to refresh', success: false }
  }

  const collection: CollectionSlug | undefined = result.user.collection
  const collectionConfig = payload.collections[collection]

  if (!collectionConfig?.config.auth) {
    throw new Error(`No auth config found for collection: ${collection}`)
  }

  const req = await createLocalReq({ user: result.user }, payload)

  const refreshResult = await refreshOperation({
    collection: collectionConfig,
    req,
  })

  if (!refreshResult) {
    return { message: 'Token refresh failed', success: false }
  }

  await setAuthCookie({
    authConfig: collectionConfig.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    serverAdapter,
    token: refreshResult.refreshedToken,
  })

  return { message: 'Token refreshed successfully', success: true }
}
