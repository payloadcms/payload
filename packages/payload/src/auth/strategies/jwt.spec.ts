import type { CollectionConfig } from '../../collections/config/types.js'
import type { Payload, PayloadRequest } from '../../types/index.js'

import { SignJWT } from 'jose'
import { describe, expect, it, vi } from 'vitest'

import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { JWT_AUTH_VERSION } from '../jwtAuth.js'
import { JWTAuthentication } from './jwt.js'

const secret = '01234567890123456789012345678901'

const signToken = async (
  tokenData: Record<string, unknown>,
  protectedHeader: { authVersion?: number | string } = {
    authVersion: JWT_AUTH_VERSION,
  },
): Promise<string> =>
  new SignJWT(tokenData)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT', ...protectedHeader })
    .sign(new TextEncoder().encode(secret))

const createPayload = (): Payload =>
  ({
    collections: {
      admins: {
        config: {
          auth: {
            depth: 0,
            useSessions: false,
            verify: false,
          },
          slug: 'admins',
        },
      },
      disabledUsers: {
        config: {
          auth: {
            depth: 0,
            disableLocalStrategy: true,
            useSessions: false,
            verify: false,
          },
          slug: 'disabledUsers',
        },
      },
      posts: {
        config: {
          auth: false,
          slug: 'posts',
        },
      },
      users: {
        config: {
          auth: {
            depth: 0,
            useSessions: false,
            verify: false,
          },
          slug: 'users',
        },
      },
    },
    config: {
      admin: {
        autoLogin: {
          email: 'dev@example.com',
        },
        user: 'users',
      },
      auth: {
        jwtOrder: ['Bearer'],
      },
      cookiePrefix: 'payload',
      csrf: [],
    },
    find: vi.fn(async ({ depth, req }: { depth: number; req?: PayloadRequest }) => {
      if (req?.query) {
        req.query.depth = depth
      }

      return {
        docs: [{ id: 'auto-login-user' }],
      }
    }),
    findByID: async ({ collection, id }) => ({
      id,
      role: collection === 'posts' ? 'admin' : 'user',
    }),
    secret,
  }) as unknown as Payload

const authenticate = async (token: string, payload = createPayload()) => {
  return JWTAuthentication({
    headers: new Headers({
      Authorization: `Bearer ${token}`,
      DisableAutologin: 'true',
    }),
    payload,
  })
}

describe('JWTAuthentication', () => {
  it.each([
    { expectedDepth: 2, isGraphQL: false, label: 'REST' },
    { expectedDepth: 0, isGraphQL: true, label: 'GraphQL' },
  ])(
    'should use the expected auth depth for $label auto-login',
    async ({ expectedDepth, isGraphQL }) => {
      const payload = createPayload()
      const req = {
        fallbackLocale: false,
        locale: 'en',
        query: { depth: 9 },
      } as PayloadRequest
      payload.collections.users.config.auth.depth = 2

      const result = await JWTAuthentication({
        headers: new Headers(),
        isGraphQL,
        payload,
        req,
      })

      expect(payload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          depth: expectedDepth,
          fallbackLocale: false,
          locale: 'en',
          req,
        }),
      )
      expect(req.query.depth).toBe(9)
      expect(result.user).toMatchObject({
        _strategy: 'local-jwt',
        collection: 'users',
        id: 'auto-login-user',
      })
    },
  )

  it('should authenticate flat v3 token data with a protected-header version marker', async () => {
    const { token } = await jwtSign({
      fieldsToSign: {
        collection: 'users',
        id: 'user-id',
        role: 'user',
      },
      secret,
      tokenExpiration: 3600,
    })

    await expect(authenticate(token)).resolves.toMatchObject({
      user: {
        _strategy: 'local-jwt',
        collection: 'users',
        id: 'user-id',
      },
    })
  })

  it('should reject existing tokens without a protected-header version marker', async () => {
    await expect(
      authenticate(
        await signToken(
          {
            collection: 'users',
            id: 'user-id',
            role: 'user',
          },
          {},
        ),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject tokens with a payload version value but no protected-header marker', async () => {
    await expect(
      authenticate(
        await signToken(
          {
            collection: 'users',
            id: 'user-id',
            authVersion: JWT_AUTH_VERSION,
            role: 'user',
          },
          {},
        ),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject tokens with an invalid protected-header version', async () => {
    await expect(
      authenticate(
        await signToken(
          {
            collection: 'users',
            id: 'user-id',
          },
          { authVersion: JWT_AUTH_VERSION + 1 },
        ),
      ),
    ).resolves.toEqual({ user: null })

    await expect(
      authenticate(
        await signToken(
          {
            collection: 'users',
            id: 'user-id',
          },
          { authVersion: '1' },
        ),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject inherited collection names', async () => {
    const payload = createPayload()
    Object.setPrototypeOf(payload.collections, { toString: payload.collections.users })

    await expect(
      authenticate(
        await signToken({
          collection: 'toString',
          id: 'user-id',
        }),
        payload,
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should accept numeric identifier zero', async () => {
    await expect(
      authenticate(
        await signToken({
          collection: 'users',
          id: 0,
        }),
      ),
    ).resolves.toMatchObject({ user: { id: 0 } })
  })

  it('should reject tokens targeting a non-auth collection', async () => {
    await expect(
      authenticate(
        await signToken({
          collection: 'posts',
          id: 'post-id',
        }),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject tokens targeting a collection with local auth disabled', async () => {
    await expect(
      authenticate(
        await signToken({
          collection: 'disabledUsers',
          id: 'user-id',
        }),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject malformed identity fields', async () => {
    await expect(
      authenticate(
        await signToken({
          collection: 'users',
          id: { value: 'user-id' },
        }),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should ignore saveToJWT aliases that target Payload-owned fields end to end', async () => {
    const collectionConfig = {
      fields: [
        {
          name: 'impersonatedID',
          saveToJWT: 'id',
          type: 'text',
        },
        {
          name: 'impersonatedCollection',
          saveToJWT: 'collection',
          type: 'text',
        },
      ],
      slug: 'users',
    } as CollectionConfig

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email: 'attacker@example.com',
      user: {
        id: 'attacker-id',
        impersonatedCollection: 'admins',
        impersonatedID: 'victim-id',
      } as PayloadRequest['user'],
    })
    const { token } = await jwtSign({
      fieldsToSign,
      secret,
      tokenExpiration: 3600,
    })
    const result = await authenticate(token)

    expect(result.user).toMatchObject({
      collection: 'users',
      id: 'attacker-id',
    })
    expect(result.user?.collection).not.toBe('admins')
    expect(result.user?.id).not.toBe('victim-id')
  })
})
