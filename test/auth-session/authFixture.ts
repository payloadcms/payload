import type {
  CollectionAfterLogoutHook as AfterLogoutHook,
  AuthStrategyFunction,
  Endpoint,
  CollectionMeHook as MeHook,
  CollectionRefreshHook as RefreshHook,
} from 'payload'

import { extractJWT, Forbidden, generatePayloadCookie } from 'payload'

import type { AuthSessionUser } from './payload-types.js'

import { createProviderRefreshBarrier } from './refreshBarrier.js'
import { createProviderSessionStore } from './sessionStore.js'
import {
  AUTH_SESSION_REFRESH_BARRIER_PHASES,
  AUTH_SESSION_TEST_ROUTES,
  AUTH_SESSION_TEST_STATUS,
  type AuthSessionRefreshBarrierPhase,
  authSessionStrategyID,
  authSessionUsersSlug,
} from './shared.js'

export const providerSessionStore = createProviderSessionStore()
const providerRefreshBarrier = createProviderRefreshBarrier()

export const authenticateProviderSession: AuthStrategyFunction = async ({ headers, payload }) => {
  const lookup = providerSessionStore.read({ token: extractJWT({ headers, payload }) })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return { user: null }
  }

  const user = await payload.findByID({
    id: lookup.session.userID,
    collection: authSessionUsersSlug,
  })

  return {
    user: {
      ...user,
      _strategy: authSessionStrategyID,
      collection: authSessionUsersSlug,
    },
  }
}

export const exposeProviderSessionExpiration: MeHook<AuthSessionUser> = ({ args, user }) => {
  const lookup = providerSessionStore.read({
    token: extractJWT({ headers: args.req.headers, payload: args.req.payload }),
  })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return
  }

  return {
    exp: Math.floor(lookup.session.expiresAtMs / 1000),
    user,
  }
}

export const rotateProviderSession: RefreshHook<AuthSessionUser> = async ({ args, user }) => {
  await providerRefreshBarrier.wait({
    phase: AUTH_SESSION_REFRESH_BARRIER_PHASES.BEFORE_ROTATION,
  })

  const lookup = providerSessionStore.rotate({
    token: extractJWT({ headers: args.req.headers, payload: args.req.payload }),
  })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    throw new Forbidden(args.req.t)
  }

  await providerRefreshBarrier.wait({
    phase: AUTH_SESSION_REFRESH_BARRIER_PHASES.AFTER_ROTATION,
  })

  return {
    exp: Math.floor(lookup.session.expiresAtMs / 1000),
    refreshedToken: lookup.session.token,
    setCookie: true,
    user,
  }
}

export const revokeProviderSessionAfterLogout: AfterLogoutHook<AuthSessionUser> = ({ req }) => {
  providerSessionStore.revoke({
    token: extractJWT({ headers: req.headers, payload: req.payload }),
  })
}

type TimeValueKey = 'durationMs' | 'nowMs'

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

const resetProviderSession: Endpoint = {
  handler: async (req) => {
    const nowMs = await readNonNegativeTimeValue({ key: 'nowMs', req })

    if (nowMs === undefined) {
      return Response.json(
        { message: 'nowMs must be a non-negative finite number.' },
        { status: 400 },
      )
    }

    providerRefreshBarrier.reset()

    return Response.json({ nowMs: providerSessionStore.reset({ nextNowMs: nowMs }) })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.RESET,
}

const loginProviderSession: Endpoint = {
  handler: async (req) => {
    const result = await req.payload.find({
      collection: authSessionUsersSlug,
      limit: 1,
    })
    const user = result.docs[0]

    if (!user) {
      return Response.json({ message: 'The session test user was not found.' }, { status: 404 })
    }

    const session = providerSessionStore.create({ userID: user.id })
    const collectionAuthConfig = req.payload.collections[authSessionUsersSlug].config.auth
    const cookie = generatePayloadCookie({
      collectionAuthConfig,
      cookiePrefix: req.payload.config.cookiePrefix,
      token: session.token,
    })

    return Response.json(
      {
        expiresAtMs: session.expiresAtMs,
      },
      {
        headers: {
          'Set-Cookie': cookie,
        },
      },
    )
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.LOGIN,
}

const advanceProviderSessionClock: Endpoint = {
  handler: async (req) => {
    const durationMs = await readNonNegativeTimeValue({ key: 'durationMs', req })

    if (durationMs === undefined) {
      return Response.json(
        { message: 'durationMs must be a non-negative finite number.' },
        { status: 400 },
      )
    }

    return Response.json({ nowMs: providerSessionStore.advanceBy({ durationMs }) })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.ADVANCE_CLOCK,
}

const revokeProviderSession: Endpoint = {
  handler: (req) => {
    const isRevoked = providerSessionStore.revoke({
      token: extractJWT({ headers: req.headers, payload: req.payload }),
    })

    return Response.json({ isRevoked })
  },
  method: 'post',
  path: AUTH_SESSION_TEST_ROUTES.REVOKE,
}

function isRefreshBarrierPhase(value: unknown): value is AuthSessionRefreshBarrierPhase {
  return Object.values(AUTH_SESSION_REFRESH_BARRIER_PHASES).some((phase) => phase === value)
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
  resetProviderSession,
  loginProviderSession,
  advanceProviderSessionClock,
  revokeProviderSession,
  armProviderRefreshBarrier,
  readProviderRefreshBarrier,
  releaseProviderRefreshBarrier,
]
