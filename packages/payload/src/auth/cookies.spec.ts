import type { CookieOptions, CookieStore } from '../admin/adapters/cookies.js'
import type { ServerAdapter } from '../admin/adapters/server.js'
import type { Config } from '../config/types.js'
import type { BasePayload } from '../index.js'

import { describe, it, expect } from 'vitest'

import { buildConfig } from '../config/build.js'
import { generatePayloadCookie, parseCookies } from './cookies.js'
import { extractJWT } from './extractJWT.js'
import { clearAuthCookie, getExistingAuthToken, setAuthCookie } from './serverFunctions/cookies.js'

describe('auth cookie prefix', () => {
  it.each([
    { cookiePrefix: undefined, expectedName: 'payload-token' },
    { cookiePrefix: '', expectedName: 'payload-token' },
    { cookiePrefix: 'my-app', expectedName: 'my-app-token' },
  ])(
    'should use $expectedName throughout the auth cookie lifecycle',
    async ({ cookiePrefix, expectedName }) => {
      const config = await buildConfig({
        collections: [
          {
            slug: 'users',
            auth: {
              cookies: { domain: 'example.com', sameSite: 'Lax', secure: true },
              tokenExpiration: 7200,
            },
            fields: [],
          },
        ],
        cookiePrefix,
        db: { defaultIDType: 'text' } as Config['db'],
        secret: 'test',
      })
      const authConfig = config.collections.find(({ slug }) => slug === 'users')!.auth
      const cookies = new Map<string, { name: string; options?: CookieOptions; value: string }>()
      const serverAdapter = {
        getCookies: () => ({ get: (name: string) => cookies.get(name) }),
        setCookie: (name: string, value: string, options?: CookieOptions) => {
          cookies.set(name, { name, options, value })
        },
      } as ServerAdapter

      const cookieHeader = generatePayloadCookie({
        collectionAuthConfig: authConfig,
        cookiePrefix: config.cookiePrefix,
        token: 'auth-token',
      })

      expect(cookieHeader).toContain(`${expectedName}=auth-token;`)

      await setAuthCookie({
        authConfig,
        cookiePrefix: config.cookiePrefix,
        serverAdapter,
        token: 'auth-token',
      })

      expect(cookies.get(expectedName)).toEqual({
        name: expectedName,
        options: {
          domain: 'example.com',
          expires: expect.any(Date),
          httpOnly: true,
          maxAge: undefined,
          path: '/',
          sameSite: 'lax',
          secure: true,
        },
        value: 'auth-token',
      })
      expect(cookies.get(expectedName)!.options!.expires!.getTime()).toBeGreaterThan(Date.now())

      const headers = new Headers({ Cookie: `${expectedName}=auth-token; -token=legacy-token` })

      expect(extractJWT({ headers, payload: { config } as BasePayload })).toBe('auth-token')
      expect(
        extractJWT({
          headers: new Headers({ Cookie: '-token=legacy-token' }),
          payload: { config } as BasePayload,
        }),
      ).toBeNull()
      await expect(
        getExistingAuthToken({ cookiePrefix: config.cookiePrefix, serverAdapter }),
      ).resolves.toEqual({ name: expectedName, options: expect.any(Object), value: 'auth-token' })

      await clearAuthCookie({ authConfig, cookiePrefix: config.cookiePrefix, serverAdapter })

      expect(cookies.size).toBe(1)
      expect(cookies.get(expectedName)).toMatchObject({
        name: expectedName,
        options: {
          domain: 'example.com',
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: true,
        },
        value: '',
      })
      expect(cookies.get(expectedName)!.options!.expires!.getTime()).toBeLessThan(Date.now())
    },
  )
})

describe.each([
  { hasGetAll: true, isAsync: false },
  { hasGetAll: false, isAsync: false },
  { hasGetAll: true, isAsync: true },
  { hasGetAll: false, isAsync: true },
])('getExistingAuthToken (getAll: $hasGetAll, async: $isAsync)', ({ hasGetAll, isAsync }) => {
  it.each([
    { cookiePrefix: 'payload', expectedName: 'payload-token' },
    { cookiePrefix: 'my-app', expectedName: 'my-app-token' },
    { cookiePrefix: '', expectedName: '-token' },
  ])(
    'should find only $expectedName among distracting cookies',
    async ({ cookiePrefix, expectedName }) => {
      const cookies = new Map(
        [
          { name: 'unrelated', value: 'unrelated' },
          { name: `${cookiePrefix}-theme`, value: 'dark' },
          { name: `${cookiePrefix}-contrast`, value: 'more' },
          { name: `${cookiePrefix}-lng`, value: 'en' },
          { name: `${cookiePrefix}-token-extra`, value: 'wrong-token' },
          { name: `${cookiePrefix}-other-token`, value: 'wrong-token' },
          { name: `${cookiePrefix}Other-token`, value: 'wrong-token' },
          { name: expectedName, value: 'auth-token' },
        ].map((cookie) => [cookie.name, cookie]),
      )
      const store: CookieStore = {
        get: (name) => cookies.get(name),
        ...(hasGetAll ? { getAll: () => [...cookies.values()] } : {}),
      }
      const serverAdapter = {
        getCookies: () => (isAsync ? Promise.resolve(store) : store),
      } as ServerAdapter

      await expect(getExistingAuthToken({ cookiePrefix, serverAdapter })).resolves.toEqual({
        name: expectedName,
        value: 'auth-token',
      })

      cookies.delete(expectedName)

      await expect(getExistingAuthToken({ cookiePrefix, serverAdapter })).resolves.toBeUndefined()
    },
  )

  it.each([null, undefined])(
    'should return undefined when the auth cookie is absent (%s)',
    async (missingCookie) => {
      const store: CookieStore = {
        get: () => missingCookie,
        ...(hasGetAll ? { getAll: () => [] } : {}),
      }
      const serverAdapter = {
        getCookies: () => (isAsync ? Promise.resolve(store) : store),
      } as ServerAdapter

      await expect(
        getExistingAuthToken({ cookiePrefix: 'payload', serverAdapter }),
      ).resolves.toBeUndefined()
    },
  )
})

describe('parseCookies', () => {
  it('parses cookie attributes without values', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; Secure; HttpOnly')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.get('Secure')).toBe('true')
    expect(parsed.get('HttpOnly')).toBe('true')
    expect(parsed.size).toBe(3)
  })
  it('strips whitespace', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; ')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.size).toBe(1)
  })

  it('ensure invalid cookies are ignored', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; invalid_cookie=%E0%A4%A')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.size).toBe(1)
  })

  it('ensure empty map is returned if there are no cookies', () => {
    const fakeHeaders = new Map()

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.size).toBe(0)
  })
})
