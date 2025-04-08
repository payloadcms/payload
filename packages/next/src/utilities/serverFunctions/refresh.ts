'use server'

import type { CollectionSlug } from 'payload'

import { cookies as getCookies, headers as nextHeaders } from 'next/headers.js'
import { generatePayloadCookie, getPayload } from 'payload'

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

    const cookies = await getCookies()
    const cookiePrefix = payload.config.cookiePrefix || 'payload'
    const cookieExpiration = authConfig.tokenExpiration
      ? new Date(Date.now() + authConfig.tokenExpiration)
      : undefined

    const existingCookie = cookies.getAll().find((cookie) => cookie.name.startsWith(cookiePrefix))

    if (!existingCookie) {
      return { message: 'No valid token found', success: false }
    }

    const payloadCookie = generatePayloadCookie({
      collectionAuthConfig: authConfig,
      cookiePrefix,
      expires: cookieExpiration,
      returnCookieAsObject: true,
      token: existingCookie.value,
    })

    if (payloadCookie.value) {
      cookies.set(payloadCookie.name, payloadCookie.value, {
        domain: authConfig.cookies.domain,
        expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
        httpOnly: true,
        sameSite: (authConfig.cookies.sameSite as any) || 'lax',
        secure: authConfig.cookies.secure || false,
      })
    }

    return { message: 'Token refreshed successfully', success: true }
  } catch (e) {
    console.error('Refresh error:', e)
    throw new Error(`${e}`)
  }
}
