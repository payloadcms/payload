import { decodeJwt } from 'jose'
import { getClientIp } from 'request-ip'
import { v4 as uuid } from 'uuid'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { TypedUser } from '../index.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { UserSession } from './types.js'

/**
 * Removes expired sessions from an array of sessions
 */
export const removeExpiredSessions = (sessions: UserSession[]) => {
  const now = new Date()

  return sessions.filter(({ expiresAt }) => {
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
    return expiry > now
  })
}

/**
 * Extracts the session ID from a JWT token string
 *
 * Note: This function does not verify the token, it only decodes it.
 *
 * @param token - The JWT token string
 * @returns The session ID or undefined if not found
 */
export const getSessionIdFromToken = (token: string): string | undefined => {
  const decodedJwt = decodeJwt(token)

  // Check if the token has "sid"
  if (!Object.hasOwn(decodedJwt, 'sid')) {
    return undefined
  }

  return decodedJwt.sid as string
}

/**
 * Adds a session to the user and removes expired sessions
 *
 * @param params - The parameters for adding a session to the user
 * @param params.collectionConfig - The collection config
 * @param params.override - Optional override for IP and user agent
 * @param params.payload - The Payload instance
 * @param params.req - The incoming payload request
 * @param params.user - The user to add the session to
 *
 * @returns The session ID (sid) if sessions are used
 */
export const addSessionToUser = async ({
  collectionConfig,
  override,
  payload,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  override?: {
    ip?: string
    userAgent?: string
  }
  payload: Payload
  req: PayloadRequest
  user: TypedUser
}): Promise<{ sid?: string }> => {
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    // Add session to user
    sid = uuid()
    const now = new Date()
    const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
    const expiresAt = new Date(now.getTime() + tokenExpInMs)

    const ip =
      override?.ip ||
      getClientIp({
        headers: Object.fromEntries(req.headers.entries()),
      })
    const userAgent = override?.userAgent || req.headers.get('user-agent')

    const session = { id: sid, createdAt: now, expiresAt, ip, userAgent }

    if (!user.sessions?.length) {
      user.sessions = [session]
    } else {
      user.sessions = removeExpiredSessions(user.sessions)
      user.sessions.push(session)
    }

    // Ensure updatedAt date is always updated
    user.updatedAt = new Date().toISOString()

    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
      returning: false,
    })

    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'
  }

  return {
    sid,
  }
}
