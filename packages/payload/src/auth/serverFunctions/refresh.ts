import type { ServerAdapter } from '../../admin/adapters/server.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { MaybePromise } from '../../types/index.js'

import { getPayload } from '../../index.js'
import { getPayloadOperation, invokeOperation } from '../../operations/index.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
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

  const refreshResult = await invokeOperation(getPayloadOperation('auth', 'refresh'), {
    context: payload,
    input: { collection: collectionConfig.config.slug, req },
    validate: false,
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
