import type { CollectionConfig } from '../../collections/config/types.js'
import type { Payload, PayloadRequest } from '../../types/index.js'

import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'

import { getFieldsToSign } from '../getFieldsToSign.js'
import { jwtSign } from '../jwt.js'
import { JWT_AUTH_VERSION } from '../jwtAuth.js'
import { JWTAuthentication } from './jwt.js'

const secret = '01234567890123456789012345678901'

const signToken = async ({
  tokenData,
  protectedHeader = { alg: 'HS256', authVersion: JWT_AUTH_VERSION, typ: 'JWT' },
}: {
  protectedHeader?: Record<string, unknown>
  tokenData: Record<string, unknown>
}): Promise<string> =>
  new SignJWT(tokenData).setProtectedHeader(protectedHeader).sign(new TextEncoder().encode(secret))

const signLegacyToken = async (tokenData: Record<string, unknown>): Promise<string> =>
  new SignJWT(tokenData)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(new TextEncoder().encode(secret))

const createPayload = (): Payload =>
  ({
    collections: {
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
      admin: {},
      auth: {
        jwtOrder: ['Bearer'],
      },
      cookiePrefix: 'payload',
      csrf: [],
    },
    encryptionKeyring: {
      all: [{ legacyKey: secret }],
    },
    findByID: async ({ collection, id }) => ({
      id,
      role: collection === 'posts' ? 'admin' : 'user',
    }),
  }) as unknown as Payload

const authenticate = async (tokenData: Record<string, unknown>) => {
  const token = await signToken({ tokenData })

  return JWTAuthentication({
    headers: new Headers({
      Authorization: `Bearer ${token}`,
      DisableAutologin: 'true',
    }),
    payload: createPayload(),
  })
}

const authenticateToken = async (token: string) =>
  JWTAuthentication({
    headers: new Headers({
      Authorization: `Bearer ${token}`,
      DisableAutologin: 'true',
    }),
    payload: createPayload(),
  })

describe('JWTAuthentication', () => {
  it('should authenticate a flat JWT issued by jwtSign', async () => {
    const { token } = await jwtSign({
      fieldsToSign: {
        collection: 'users',
        id: 'user-id',
        role: 'user',
      },
      secret,
      tokenExpiration: 3600,
    })

    await expect(authenticateToken(token)).resolves.toMatchObject({
      user: {
        _strategy: 'local-jwt',
        collection: 'users',
        id: 'user-id',
      },
    })
  })

  it('should reject a legacy header when the payload includes version data', async () => {
    await expect(
      authenticateToken(
        await signLegacyToken({
          collection: 'users',
          id: 'user-id',
          authVersion: 1,
          auth: {
            collection: 'users',
            id: 'user-id',
            version: 1,
          },
        }),
      ),
    ).resolves.toEqual({ user: null })
  })

  it('should reject tokens targeting a non-auth collection', async () => {
    await expect(
      authenticate({
        collection: 'posts',
        id: 'post-id',
      }),
    ).resolves.toEqual({ user: null })
  })

  it('should reject tokens targeting a collection with local auth disabled', async () => {
    await expect(
      authenticate({
        collection: 'disabledUsers',
        id: 'user-id',
      }),
    ).resolves.toEqual({ user: null })
  })

  it.each([
    { alg: 'HS256', authVersion: JWT_AUTH_VERSION + 1, typ: 'JWT' },
    { alg: 'HS256', authVersion: '1', typ: 'JWT' },
  ])('should reject a token with an invalid protected-header marker', async (protectedHeader) => {
    await expect(
      authenticateToken(
        await signToken({
          protectedHeader,
          tokenData: { collection: 'users', id: 'user-id' },
        }),
      ),
    ).resolves.toEqual({ user: null })
  })

  it.each(['constructor', 'toString'])(
    'should reject an inherited collection name',
    async (collection) => {
      await expect(authenticate({ collection, id: 'user-id' })).resolves.toEqual({ user: null })
    },
  )

  it('should authenticate a numeric id of zero', async () => {
    await expect(authenticate({ collection: 'users', id: 0 })).resolves.toMatchObject({
      user: {
        id: 0,
      },
    })
  })

  it('should accept flat token data built by getFieldsToSign', async () => {
    const fieldsToSign = getFieldsToSign({
      collectionConfig: { fields: [], slug: 'users' } as unknown as CollectionConfig,
      email: 'dev@example.com',
      user: { id: 'user-id' } as PayloadRequest['user'],
    })

    await expect(authenticate(fieldsToSign)).resolves.toMatchObject({
      user: {
        collection: 'users',
        id: 'user-id',
      },
    })
  })

  it('should ignore saveToJWT aliases that target Payload-owned fields end to end', async () => {
    const collectionConfig = {
      fields: [
        {
          name: 'alternateID',
          saveToJWT: 'id',
          type: 'text',
        },
        {
          name: 'alternateCollection',
          saveToJWT: 'collection',
          type: 'text',
        },
      ],
      slug: 'users',
    } as unknown as CollectionConfig

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email: 'account@example.com',
      user: {
        id: 'account-id',
        alternateCollection: 'admins',
        alternateID: 'alternate-id',
      } as PayloadRequest['user'],
    })

    const { token } = await jwtSign({
      fieldsToSign,
      secret,
      tokenExpiration: 3600,
    })
    const result = await authenticateToken(token)

    expect(result.user).toMatchObject({
      collection: 'users',
      id: 'account-id',
    })
    expect(result.user?.id).not.toBe('alternate-id')
    expect(result.user?.collection).not.toBe('admins')
  })
})
