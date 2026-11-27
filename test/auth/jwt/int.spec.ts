import type { CollectionRefreshHook, Payload } from 'payload'

import { jwtDecode } from 'jwt-decode'
import { createPayloadRequest, createPayloadRequestFromWebRequest } from 'payload'
import { v4 as uuid } from 'uuid'
import { expect } from 'vitest'

import type { RESTClient } from '../../__helpers/shared/RESTClient.js'

import { test } from '../../__helpers/int/vitest.js'
import { devUser } from '../../credentials.js'
import { jwtUsersSlug, restrictedRelationshipsSlug } from '../shared.js'

let payload: Payload
let restClient: RESTClient

const { password } = devUser
test.suite(
  'JWT authentication read access',
  { config: './config.ts', resetBetweenTests: false },
  () => {
    test.beforeAll(({ payloadInstance, restClientInstance }) => {
      payload = payloadInstance
      restClient = restClientInstance
    })

    const createdJWTUserIDs: Array<number | string> = []
    const createdRestrictedRelationshipIDs: Array<number | string> = []

    test.afterEach(async () => {
      for (const id of createdJWTUserIDs) {
        await payload.delete({ id, collection: jwtUsersSlug as any, overrideAccess: true })
      }

      for (const id of createdRestrictedRelationshipIDs) {
        await payload.delete({
          id,
          collection: restrictedRelationshipsSlug as any,
          overrideAccess: true,
        })
      }

      createdJWTUserIDs.length = 0
      createdRestrictedRelationshipIDs.length = 0
    })

    test.describe('Cross-site iframe cookie auth', () => {
      const frontendOrigin = 'https://preview.example.com'
      let originalCSRF: string[]
      let token: string
      let userID: number | string

      test.beforeAll(async ({ payloadInstance: payload }) => {
        const data = { email: `iframe-${uuid()}@example.com`, password }
        const user = await payload.create({
          collection: jwtUsersSlug as any,
          data,
          overrideAccess: true,
        })
        userID = user.id
        const result = await payload.login({ collection: jwtUsersSlug as any, data })

        token = result.token!
      })

      test.afterAll(async ({ payloadInstance: payload }) => {
        await payload.delete({ id: userID, collection: jwtUsersSlug as any, overrideAccess: true })
      })

      test.beforeEach(({ payloadInstance: payload }) => {
        originalCSRF = payload.config.csrf
        payload.config.csrf = [frontendOrigin]
      })

      test.afterEach(({ payloadInstance: payload }) => {
        payload.config.csrf = originalCSRF
      })

      test('should authenticate an iframe navigation from an allowed frontend', async ({
        restClient,
      }) => {
        const response = await restClient.GET(`/${jwtUsersSlug}/me`, {
          auth: false,
          headers: {
            Cookie: `payload-token=${token}`,
            Referer: `${frontendOrigin}/preview`,
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
          },
        })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.user?.id).toBe(userID)
      })

      for (const method of ['HEAD', undefined]) {
        test(`should authenticate a trusted iframe when method is ${method}`, async ({
          payload,
        }) => {
          const headers = new Headers({
            Cookie: `payload-token=${token}`,
            DisableAutologin: 'true',
            Referer: `${frontendOrigin}/preview`,
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
          })
          const req = await createPayloadRequest({ payload, req: { headers, method } })
          const { user } = await payload.auth({ headers, req })

          expect(user?.id).toBe(userID)
        })
      }

      for (const [name, headers] of [
        ['an unlisted referrer', { Referer: 'https://attacker.example/preview' }],
        ['a missing referrer', { Referer: '' }],
        ['a malformed referrer', { Referer: 'invalid' }],
        ['an unlisted Origin', { Origin: 'https://attacker.example' }],
        ['a fetch request', { 'Sec-Fetch-Mode': 'cors' }],
        ['a non-iframe destination', { 'Sec-Fetch-Dest': 'empty' }],
      ] as const) {
        test(`should reject cookie auth with ${name}`, async ({ restClient }) => {
          const response = await restClient.GET(`/${jwtUsersSlug}/me`, {
            auth: false,
            headers: {
              Cookie: `payload-token=${token}`,
              Referer: `${frontendOrigin}/preview`,
              'Sec-Fetch-Dest': 'iframe',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'cross-site',
              ...headers,
            },
          })
          const result = await response.json()

          expect(result.user).toBeNull()
        })
      }

      test('should reject an iframe POST even with an allowed referrer', async ({ restClient }) => {
        const response = await restClient.POST(`/${jwtUsersSlug}/refresh-token`, {
          auth: false,
          headers: {
            Cookie: `payload-token=${token}`,
            Referer: `${frontendOrigin}/preview`,
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
          },
        })

        expect(response.status).toBe(403)
      })
    })

    test('should return a user with read access from JWT authentication', async () => {
      const restrictedRelationship = await payload.create({
        collection: restrictedRelationshipsSlug as any,
        data: {
          privateField: 'private value',
          publicField: 'public value',
        },
        overrideAccess: true,
      })

      const email = `jwt-user-${uuid()}@example.com`
      const user = await payload.create({
        collection: jwtUsersSlug as any,
        data: {
          email,
          password,
          restrictedField: 'restricted value',
          restrictedRelationship: restrictedRelationship.id,
        },
        overrideAccess: true,
      })

      createdRestrictedRelationshipIDs.push(restrictedRelationship.id)
      createdJWTUserIDs.push(user.id)

      const { token } = await payload.login({
        collection: jwtUsersSlug as any,
        data: { email, password },
        overrideAccess: true,
      })

      const authenticated = await restClient
        .GET(`/${jwtUsersSlug}/me`, {
          headers: { Authorization: `JWT ${token}` },
        })
        .then((response) => response.json())

      const userWithReadAccess = authenticated.user as {
        restrictedRelationship?:
          | {
              id: number | string
              privateField?: string
              publicField?: string
            }
          | number
      }

      expect(userWithReadAccess.id).toBe(user.id)
      expect(userWithReadAccess).not.toHaveProperty('restrictedField')
      expect(userWithReadAccess.restrictedRelationship).toMatchObject({
        id: restrictedRelationship.id,
        publicField: 'public value',
      })
      expect(userWithReadAccess.restrictedRelationship).not.toHaveProperty('privateField')
    })

    test('should run afterRead hooks and populate req.user at the configured auth depth', async () => {
      const restrictedRelationship = await payload.create({
        collection: restrictedRelationshipsSlug as any,
        data: {
          publicField: 'public relationship',
        },
        overrideAccess: true,
      })
      const email = `jwt-req-user-${uuid()}@example.com`
      const user = await payload.create({
        collection: jwtUsersSlug as any,
        data: {
          email,
          password,
          restrictedField: 'restricted value',
          restrictedRelationship: restrictedRelationship.id,
        },
        overrideAccess: true,
      })

      createdRestrictedRelationshipIDs.push(restrictedRelationship.id)
      createdJWTUserIDs.push(user.id)

      const { token } = await payload.login({
        collection: jwtUsersSlug as any,
        data: { email, password },
        overrideAccess: true,
      })
      const headers = { Authorization: `JWT ${token}` }
      const req = await createPayloadRequestFromWebRequest({
        config: payload.config,
        request: new Request(
          'http://localhost/api/auth-read-hook?locale=fr&fallbackLocale=none&depth=2',
          { headers },
        ),
      })
      const graphQLReq = await createPayloadRequestFromWebRequest({
        config: payload.config,
        request: new Request('http://localhost/api/graphql', { headers }),
      })
      const authenticatedUser = req.user as
        | ({
            authReadHookFallbackLocale?: false | string
            authReadHookLocale?: string
            authReadHookRan?: boolean
            authReadHookRelationshipValue?: string
            restrictedField?: string
            restrictedRelationship?: { id: number | string; publicField?: string }
          } & NonNullable<typeof req.user>)
        | null

      expect(authenticatedUser?.id).toBe(user.id)
      expect(authenticatedUser?.authReadHookRan).toBe(true)
      expect(authenticatedUser?.authReadHookFallbackLocale).toBe(false)
      expect(authenticatedUser?.authReadHookLocale).toBe('fr')
      expect(authenticatedUser?.authReadHookRelationshipValue).toBe('public relationship')
      expect(authenticatedUser?.restrictedField).toBe('restricted value')
      expect(authenticatedUser?.restrictedRelationship).toMatchObject({
        id: restrictedRelationship.id,
        publicField: 'public relationship',
      })
      expect(req.locale).toBe('fr')
      expect(req.fallbackLocale).toBe(false)
      expect(req.query.depth).toBe('2')
      expect(graphQLReq.user).toMatchObject({
        id: user.id,
        authReadHookRan: true,
        restrictedField: 'restricted value',
        restrictedRelationship: restrictedRelationship.id,
      })
    })

    test('should return a user with read access from the refresh operation', async () => {
      const restrictedField = 'restricted value'
      const email = `jwt-refresh-${uuid()}@example.com`
      const user = await payload.create({
        collection: jwtUsersSlug as any,
        data: {
          email,
          password,
          restrictedField,
        },
        overrideAccess: true,
      })

      createdJWTUserIDs.push(user.id)

      const authenticated = await payload.login({
        collection: jwtUsersSlug as any,
        data: { email, password },
        overrideAccess: true,
      })
      const refreshHooks = payload.collections[jwtUsersSlug]!.config.hooks.refresh
      const hookEmail = `hook-${email}`
      const refreshHook: CollectionRefreshHook = ({ args, user }) => {
        user.authRefreshHookValue = user.restrictedField

        if (args.req.headers.get('x-auth-return-user') === 'true') {
          return {
            exp: jwtDecode<{ exp: number }>(authenticated.token!).exp,
            refreshedToken: authenticated.token!,
            user: { ...user, email: hookEmail },
          }
        }
      }

      refreshHooks.push(refreshHook)

      try {
        const response = await restClient.POST(`/${jwtUsersSlug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${authenticated.token}`,
            'x-auth-transform-jwt': 'true',
          },
        })
        const refreshed = await response.json()

        expect(response.status).toBe(200)
        expect(jwtDecode<{ restrictedField?: string }>(authenticated.token!).restrictedField).toBe(
          restrictedField,
        )
        expect
          .soft(jwtDecode<{ restrictedField?: string }>(refreshed.refreshedToken).restrictedField)
          .toBe('transformed value')
        expect(refreshed.user.id).toBe(user.id)
        expect.soft(refreshed.user.authRefreshHookValue).toBe(restrictedField)
        expect(refreshed.user).not.toHaveProperty('restrictedField')

        const hookResponse = await restClient.POST(`/${jwtUsersSlug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${authenticated.token}`,
            'x-auth-return-user': 'true',
          },
        })
        const hookRefreshed = await hookResponse.json()

        expect(hookResponse.status).toBe(200)
        expect(hookRefreshed.user.email).toBe(hookEmail)
        expect(hookRefreshed.user).not.toHaveProperty('restrictedField')
      } finally {
        refreshHooks.splice(refreshHooks.indexOf(refreshHook), 1)
      }
    })
  },
)
