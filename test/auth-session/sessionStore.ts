import { randomUUID } from 'node:crypto'

import { AUTH_SESSION_TEST_STATUS, authSessionTokenLifetimeMs } from './shared.js'

export type ProviderSession = {
  expiresAtMs: number
  token: string
  userID: number | string
}

export type ProviderSessionLookup =
  | {
      session: ProviderSession
      status: typeof AUTH_SESSION_TEST_STATUS.AUTHENTICATED
    }
  | {
      status: typeof AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED
    }

export function createProviderSessionStore() {
  let nowMs = Date.now()
  const sessions = new Map<string, ProviderSession>()

  const read = ({ token }: { token: null | string }): ProviderSessionLookup => {
    const session = token ? sessions.get(token) : undefined

    if (!session || session.expiresAtMs <= nowMs) {
      if (token) {
        sessions.delete(token)
      }

      return { status: AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED }
    }

    return { session, status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED }
  }

  const create = ({ userID }: { userID: number | string }): ProviderSession => {
    const token = randomUUID()
    const session = {
      expiresAtMs: nowMs + authSessionTokenLifetimeMs,
      token,
      userID,
    }

    sessions.set(token, session)

    return session
  }

  return {
    advanceBy({ durationMs }: { durationMs: number }): number {
      nowMs += durationMs
      return nowMs
    },
    create,
    read,
    reset({ nextNowMs }: { nextNowMs: number }): number {
      nowMs = nextNowMs
      sessions.clear()
      return nowMs
    },
    revoke({ token }: { token: null | string }): boolean {
      return token ? sessions.delete(token) : false
    },
    rotate({ token }: { token: null | string }): ProviderSessionLookup {
      const current = read({ token })

      if (current.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
        return current
      }

      sessions.delete(current.session.token)

      return {
        session: create({ userID: current.session.userID }),
        status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED,
      }
    },
  }
}
