import type {
  CollectionAfterLogoutHook as AfterLogoutHook,
  AuthStrategyFunction,
  Endpoint,
  CollectionMeHook as MeHook,
  CollectionRefreshHook as RefreshHook,
} from 'payload'

import { Forbidden, generateCookie, parseCookies } from 'payload'

import type { AuthSessionUser } from './payload-types.js'
import type { TestOAuthSession } from './testOAuthSessionStore.js'

import { createProviderRefreshBarrier } from './refreshBarrier.js'
import {
  AUTH_SESSION_REFRESH_BARRIER_PHASES,
  AUTH_SESSION_TEST_ROUTES,
  AUTH_SESSION_TEST_STATUS,
  authSessionAccessTokenCookieName,
  type AuthSessionRefreshBarrierPhase,
  authSessionRefreshTokenCookieName,
  authSessionStrategyID,
  authSessionUsersSlug,
} from './shared.js'
import { createTestOAuthSessionStore } from './testOAuthSessionStore.js'

type OAuthCookies = {
  accessToken: null | string
  refreshToken: null | string
}

type TimeValueKey = 'durationMs' | 'nowMs'

const readOAuthCookies = (headers: Headers): OAuthCookies => {
  const cookies = parseCookies(headers)

  return {
    accessToken: cookies.get(authSessionAccessTokenCookieName) ?? null,
    refreshToken: cookies.get(authSessionRefreshTokenCookieName) ?? null,
  }
}

const createOAuthCookie = ({
  name,
  expiresAtMs,
  token,
}: {
  expiresAtMs: number
  name: string
  token: string
}): string =>
  generateCookie({
    name,
    expires: new Date(expiresAtMs),
    httpOnly: true,
    path: '/',
    returnCookieAsObject: false,
    sameSite: 'Lax',
    secure: false,
    value: token,
  }) as string

const expireOAuthCookie = (name: string): string =>
  generateCookie({
    name,
    expires: new Date(0),
    httpOnly: true,
    path: '/',
    returnCookieAsObject: false,
    sameSite: 'Lax',
    secure: false,
    value: '',
  }) as string

const appendOAuthSessionCookies = ({
  headers,
  session,
}: {
  headers: Headers
  session: TestOAuthSession
}): void => {
  headers.append(
    'Set-Cookie',
    createOAuthCookie({
      name: authSessionAccessTokenCookieName,
      expiresAtMs: session.accessTokenExpiresAtMs,
      token: session.accessToken,
    }),
  )
  headers.append(
    'Set-Cookie',
    createOAuthCookie({
      name: authSessionRefreshTokenCookieName,
      expiresAtMs: session.refreshTokenExpiresAtMs,
      token: session.refreshToken,
    }),
  )
}

const appendExpiredOAuthCookies = (headers: Headers): void => {
  headers.append('Set-Cookie', expireOAuthCookie(authSessionAccessTokenCookieName))
  headers.append('Set-Cookie', expireOAuthCookie(authSessionRefreshTokenCookieName))
}

async function readNonNegativeTimeValue({
  key,
  req,
}: {
  key: TimeValueKey
  req: Parameters<Endpoint['handler']>[0]
}): Promise<number | undefined> {
  try {
    const body: unknown = req.json ? await req.json() : req.body

    if (
      !body ||
      typeof body !== 'object' ||
      !(key in body) ||
      typeof body[key as keyof typeof body] !== 'number'
    ) {
      return
    }

    const value = body[key as keyof typeof body]

    return Number.isFinite(value) && value >= 0 ? value : undefined
  } catch {
    return
  }
}

function isRefreshBarrierPhase(value: unknown): value is AuthSessionRefreshBarrierPhase {
  return Object.values(AUTH_SESSION_REFRESH_BARRIER_PHASES).some((phase) => phase === value)
}

export const testOAuthSessionStore = createTestOAuthSessionStore()
const providerRefreshBarrier = createProviderRefreshBarrier()
const refreshedSessionsByRequestHeaders = new WeakMap<Headers, TestOAuthSession>()

/**
 * Authenticates with the access token or renews it from the longer-lived refresh token.
 *
 * The request-scoped session lets `/me` and `/refresh-token` reuse that renewal instead of
 * rotating the same refresh token twice.
 */
export const authenticateTestOAuthSession: AuthStrategyFunction = async ({
  canSetHeaders,
  headers,
  payload,
}) => {
  const { accessToken, refreshToken } = readOAuthCookies(headers)
  let lookup = testOAuthSessionStore.readAccessToken({ token: accessToken })
  let responseHeaders: Headers | undefined

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED && canSetHeaders) {
    lookup = testOAuthSessionStore.rotate({ refreshToken })

    if (lookup.status === AUTH_SESSION_TEST_STATUS.AUTHENTICATED) {
      refreshedSessionsByRequestHeaders.set(headers, lookup.session)
      responseHeaders = new Headers()
      appendOAuthSessionCookies({ headers: responseHeaders, session: lookup.session })
    }
  }

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return { user: null }
  }

  const user = await payload.findByID({
    id: lookup.session.userID,
    collection: authSessionUsersSlug,
  })

  return {
    responseHeaders,
    user: {
      ...user,
      _strategy: authSessionStrategyID,
      collection: authSessionUsersSlug,
    },
  }
}

export const exposeTestOAuthSessionExpiration: MeHook<AuthSessionUser> = ({ args, user }) => {
  const refreshedSession = refreshedSessionsByRequestHeaders.get(args.req.headers)

  if (refreshedSession) {
    return {
      exp: Math.floor(refreshedSession.accessTokenExpiresAtMs / 1000),
      user,
    }
  }

  const { accessToken } = readOAuthCookies(args.req.headers)
  const lookup = testOAuthSessionStore.readAccessToken({ token: accessToken })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return
  }

  return {
    exp: Math.floor(lookup.session.accessTokenExpiresAtMs / 1000),
    user,
  }
}

export const rotateTestOAuthSession: RefreshHook<AuthSessionUser> = async ({ args, user }) => {
  const sessionRefreshedDuringAuthentication = refreshedSessionsByRequestHeaders.get(
    args.req.headers,
  )
  let session = sessionRefreshedDuringAuthentication

  refreshedSessionsByRequestHeaders.delete(args.req.headers)

  if (!session) {
    const { refreshToken } = readOAuthCookies(args.req.headers)
    const lookup = testOAuthSessionStore.rotate({ refreshToken })

    if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
      throw new Forbidden(args.req.t)
    }

    session = lookup.session
  }

  await providerRefreshBarrier.wait({
    phase: AUTH_SESSION_REFRESH_BARRIER_PHASES.AFTER_ROTATION,
  })

  args.req.responseHeaders ??= new Headers()

  if (!sessionRefreshedDuringAuthentication) {
    appendOAuthSessionCookies({ headers: args.req.responseHeaders, session })
  }

  return {
    exp: Math.floor(session.accessTokenExpiresAtMs / 1000),
    refreshedToken: session.accessToken,
    user,
  }
}

export const revokeTestOAuthSessionAfterLogout: AfterLogoutHook<AuthSessionUser> = ({ req }) => {
  const cookies = readOAuthCookies(req.headers)

  refreshedSessionsByRequestHeaders.delete(req.headers)
  testOAuthSessionStore.revoke(cookies)
  req.responseHeaders ??= new Headers()
  appendExpiredOAuthCookies(req.responseHeaders)
}

const resetTestOAuthSession: Endpoint = {
  handler: async (req) => {
    const nowMs = await readNonNegativeTimeValue({ key: 'nowMs', req })

    if (nowMs === undefined) {
      return Response.json(
        { message: 'nowMs must be a non-negative finite number.' },
        { status: 400 },
      )
    }

    providerRefreshBarrier.reset()

    return Response.json({ nowMs: testOAuthSessionStore.reset({ nextNowMs: nowMs }) })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.RESET,
}

const loginTestOAuthSession: Endpoint = {
  handler: async (req) => {
    const result = await req.payload.find({
      collection: authSessionUsersSlug,
      limit: 1,
    })
    const user = result.docs[0]

    if (!user) {
      return Response.json({ message: 'The session test user was not found.' }, { status: 404 })
    }

    const session = testOAuthSessionStore.create({ userID: user.id })
    const headers = new Headers()

    appendOAuthSessionCookies({ headers, session })

    return Response.json(
      {
        expiresAtMs: session.accessTokenExpiresAtMs,
      },
      { headers },
    )
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.LOGIN,
}

const advanceTestOAuthSessionClock: Endpoint = {
  handler: async (req) => {
    const durationMs = await readNonNegativeTimeValue({ key: 'durationMs', req })

    if (durationMs === undefined) {
      return Response.json(
        { message: 'durationMs must be a non-negative finite number.' },
        { status: 400 },
      )
    }

    return Response.json({ nowMs: testOAuthSessionStore.advanceBy({ durationMs }) })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.ADVANCE_CLOCK,
}

const revokeTestOAuthSession: Endpoint = {
  handler: (req) => {
    const isRevoked = testOAuthSessionStore.revoke(readOAuthCookies(req.headers))

    return Response.json({ isRevoked })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.REVOKE,
}

const armProviderRefreshBarrier: Endpoint = {
  handler: async (req) => {
    const body: unknown = req.json ? await req.json() : req.body

    if (
      !body ||
      typeof body !== 'object' ||
      !('phase' in body) ||
      !isRefreshBarrierPhase(body.phase)
    ) {
      return Response.json(
        { message: 'A valid refresh barrier phase is required.' },
        { status: 400 },
      )
    }

    providerRefreshBarrier.arm({ phase: body.phase })

    return Response.json({ phase: body.phase })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.ARM_REFRESH_BARRIER,
}

const readProviderRefreshBarrier: Endpoint = {
  handler: () => Response.json(providerRefreshBarrier.read() ?? null),
  method: 'get',
  path: AUTH_SESSION_TEST_ROUTES.REFRESH_BARRIER_STATUS,
}

const releaseProviderRefreshBarrier: Endpoint = {
  handler: () => {
    providerRefreshBarrier.release()

    return Response.json({ isReleased: true })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.RELEASE_REFRESH_BARRIER,
}

export const authSessionTestEndpoints: Endpoint[] = [
  resetTestOAuthSession,
  loginTestOAuthSession,
  advanceTestOAuthSessionClock,
  revokeTestOAuthSession,
  armProviderRefreshBarrier,
  readProviderRefreshBarrier,
  releaseProviderRefreshBarrier,
]
