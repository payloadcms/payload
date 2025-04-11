'use server'

import type { CollectionSlug } from 'payload'

import { headers as nextHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { getExistingAuthToken } from '../utilities/getExistingAuthToken.js'
import { setPayloadAuthCookie } from '../utilities/setPayloadAuthCookie.js'

export async function refresh({ collection, config }: { collection: CollectionSlug; config: any }) {
  try {
    const payload = await getPayload({ config })
    const authConfig = payload.collections[collection]?.config.auth

    if (!authConfig) {
      throw new Error(`No auth config found for collection: ${collection}`)
    }

    const { user } = await payload.auth({ headers: await nextHeaders() })
    if (!user) {
      throw new Error('User not authenticated')
    }

    const existingCookie = await getExistingAuthToken(payload.config.cookiePrefix)

    if (!existingCookie) {
      return { message: 'No valid token found', success: false }
    }

    await setPayloadAuthCookie({
      authConfig,
      cookiePrefix: payload.config.cookiePrefix,
      token: existingCookie.value,
    })

    return { message: 'Token refreshed successfully', success: true }
  } catch (e) {
    console.error('Refresh error:', e)
    throw new Error(`${e}`)
  }
}
