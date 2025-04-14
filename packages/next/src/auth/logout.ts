'use server'

import { cookies as getCookies, headers as nextHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { getExistingAuthToken } from '../utilities/getExistingAuthToken.js'

export async function logout({ config }: { config: any }) {
  try {
    const payload = await getPayload({ config })
    const headers = await nextHeaders()
    const result = await payload.auth({ headers })

    if (!result.user) {
      return { message: 'User already logged out', success: true }
    }

    const existingCookie = await getExistingAuthToken(payload.config.cookiePrefix)

    if (existingCookie) {
      const cookies = await getCookies()
      cookies.delete(existingCookie.name)
      return { message: 'User logged out successfully', success: true }
    }
  } catch (e) {
    console.error('Logout error:', e)
    throw new Error(`${e}`)
  }
}
