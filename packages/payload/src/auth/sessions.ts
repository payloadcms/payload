import { v4 as uuid } from 'uuid'

import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { TypedUser } from '../index.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { UntypedUser, UserSession } from './types.js'

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
 * Adds a session to the user and removes expired sessions
 * @returns The session ID (sid) if sessions are used
 */
export const addSessionToUser = async ({
  collectionConfig,
  payload,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  user: TypedUser
}): Promise<{ sid?: string }> => {
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    sid = uuid()
    const now = new Date()
    const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
    const expiresAt = new Date(now.getTime() + tokenExpInMs)

    const session = { id: sid, createdAt: now, expiresAt }

    // Re-read the user's sessions from the DB inside the active transaction.
    // The `user` passed in was read before the transaction started, so concurrent
    // logins that race past the password check can each hold a stale snapshot of
    // `user.sessions`. Without this re-read, whichever request commits last
    // overwrites the other's session, leaving the first token referencing a sid
    // that no longer exists in the DB — which causes /api/users/me to return 403.
    const freshUser = await payload.db.findOne<TypedUser>({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: user.id } },
    })
    const currentSessions: UserSession[] = (freshUser as TypedUser | null)?.sessions ?? []

    user.sessions = [...removeExpiredSessions(currentSessions), session]

    // Prevent updatedAt from being updated when only adding a session
    user.updatedAt = null

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

export const revokeSession = async ({
  collectionConfig,
  payload,
  req,
  sid,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  sid: string
  user: null | (TypeWithID & UntypedUser)
}): Promise<void> => {
  if (collectionConfig.auth.useSessions && user && user.sessions?.length) {
    user.sessions = user.sessions.filter((session) => session.id !== sid)
    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
      returning: false,
    })
  }
}
