'use server'

import type { SanitizedConfig } from 'payload'

import { cookies as getCookies, headers as nextHeaders } from 'next/headers.js'
import { createLocalReq, getPayload, logoutOperation } from 'payload'

import { getExistingAuthToken } from '../utilities/getExistingAuthToken.js'

export async function logout({
  allSessions = false,
  config,
}: {
  allSessions?: boolean
  config: Promise<SanitizedConfig> | SanitizedConfig
}) {
  const payload = await getPayload({ config, cron: true })
  const headers = await nextHeaders()
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

  const existingCookie = await getExistingAuthToken(payload.config.cookiePrefix)
  if (existingCookie) {
    const cookies = await getCookies()
    cookies.delete(existingCookie.name)
  }

  return { message: 'User logged out successfully', success: true }
}
