import type { CollectionSlug, MaybePromise, SanitizedConfig } from 'payload'

import { getRequest } from '@tanstack/react-start/server'
import { createLocalReq, getPayload, refreshOperation } from 'payload'

import { getExistingAuthToken } from '../utilities/getExistingAuthToken.js'
import { setPayloadAuthCookie } from '../utilities/setPayloadAuthCookie.js'

export async function refresh({ config }: { config: MaybePromise<SanitizedConfig> }) {
  const payload = await getPayload({ config })
  const request = getRequest()
  const headers = new Headers(request.headers)
  const result = await payload.auth({ headers })

  if (!result.user) {
    throw new Error('Cannot refresh token: user not authenticated')
  }

  const existingCookie = getExistingAuthToken(payload.config.cookiePrefix)
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

  setPayloadAuthCookie({
    authConfig: collectionConfig.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token: refreshResult.refreshedToken,
  })

  return { message: 'Token refreshed successfully', success: true }
}
