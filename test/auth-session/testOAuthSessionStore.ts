import { randomUUID } from 'node:crypto'

import {
  AUTH_SESSION_TEST_STATUS,
  authSessionAccessTokenLifetimeMs,
  authSessionRefreshTokenLifetimeMs,
} from './shared.js'

export type TestOAuthSession = {
  accessToken: string
  accessTokenExpiresAtMs: number
  refreshToken: string
  refreshTokenExpiresAtMs: number
  userID: number | string
}

export type TestOAuthSessionLookup =
  | {
      session: TestOAuthSession
      status: typeof AUTH_SESSION_TEST_STATUS.AUTHENTICATED
    }
  | {
      status: typeof AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED
    }

type StoredOAuthSession = {
  id: string
} & TestOAuthSession

/**
 * Stores the provider-owned access and refresh tokens used by the auth session E2E tests.
 *
 * Access and refresh tokens rotate together. Old tokens retain their session-family lookup so a
 * logout racing with refresh can revoke credentials that were rotated but not yet returned.
 */
export function createTestOAuthSessionStore() {
  let nowMs = Date.now()
  const sessionIDsByToken = new Map<string, string>()
  const sessions = new Map<string, StoredOAuthSession>()

  const createSession = ({
    id = randomUUID(),
    userID,
  }: {
    id?: string
    userID: number | string
  }): StoredOAuthSession => {
    const session = {
      id,
      accessToken: randomUUID(),
      accessTokenExpiresAtMs: nowMs + authSessionAccessTokenLifetimeMs,
      refreshToken: randomUUID(),
      refreshTokenExpiresAtMs: nowMs + authSessionRefreshTokenLifetimeMs,
      userID,
    }

    sessions.set(id, session)
    sessionIDsByToken.set(session.accessToken, id)
    sessionIDsByToken.set(session.refreshToken, id)

    return session
  }

  const readCurrentSession = ({
    expiresAt,
    token,
    tokenType,
  }: {
    expiresAt: (session: StoredOAuthSession) => number
    token: null | string
    tokenType: 'accessToken' | 'refreshToken'
  }): TestOAuthSessionLookup => {
    const sessionID = token ? sessionIDsByToken.get(token) : undefined
    const session = sessionID ? sessions.get(sessionID) : undefined

    if (!session || session[tokenType] !== token || expiresAt(session) <= nowMs) {
      return { status: AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED }
    }

    return { session, status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED }
  }

  return {
    advanceBy({ durationMs }: { durationMs: number }): number {
      nowMs += durationMs
      return nowMs
    },
    create({ userID }: { userID: number | string }): TestOAuthSession {
      return createSession({ userID })
    },
    readAccessToken({ token }: { token: null | string }): TestOAuthSessionLookup {
      return readCurrentSession({
        expiresAt: (session) => session.accessTokenExpiresAtMs,
        token,
        tokenType: 'accessToken',
      })
    },
    reset({ nextNowMs }: { nextNowMs: number }): number {
      nowMs = nextNowMs
      sessionIDsByToken.clear()
      sessions.clear()
      return nowMs
    },
    revoke({
      accessToken,
      refreshToken,
    }: {
      accessToken: null | string
      refreshToken: null | string
    }): boolean {
      const sessionID =
        (accessToken ? sessionIDsByToken.get(accessToken) : undefined) ??
        (refreshToken ? sessionIDsByToken.get(refreshToken) : undefined)

      return sessionID ? sessions.delete(sessionID) : false
    },
    rotate({ refreshToken }: { refreshToken: null | string }): TestOAuthSessionLookup {
      const current = readCurrentSession({
        expiresAt: (session) => session.refreshTokenExpiresAtMs,
        token: refreshToken,
        tokenType: 'refreshToken',
      })

      if (current.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
        return current
      }

      const sessionID = sessionIDsByToken.get(current.session.refreshToken)

      if (!sessionID) {
        return { status: AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED }
      }

      return {
        session: createSession({
          id: sessionID,
          userID: current.session.userID,
        }),
        status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED,
      }
    },
  }
}
