import type {
  BasePayload,
  EmailFieldValidation,
  FieldAffectingData,
  Payload,
  SanitizedConfig,
  User,
} from 'payload'

import crypto from 'crypto'
import { jwtDecode } from 'jwt-decode'
import {
  createLocalReq,
  Forbidden,
  getFieldsToSign,
  migrateAPIKeysToHash,
  refreshOperation,
  rotateSecret,
} from 'payload'
import { email as emailValidation } from 'payload/shared'
import { v4 as uuid } from 'uuid'
import { expect, vitest } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  apiKeyOnlySlug,
  apiKeyProofSlug,
  apiKeysSlug,
  apiKeysWithFieldUpdateAccessSlug,
  namedSaveToJWTValue,
  partialDisableLocalStrategiesSlug,
  publicUsersSlug,
  rotateSecretLoginSlug,
  rotateSecretOldSecret,
  rotateSecretSecondarySlug,
  rotateSecretSlug,
  saveToJWTKey,
  slug,
} from './shared.js'

const { email, password } = devUser

test.suite({ config: './config.ts' })('Auth', () => {
  test.describe('GraphQL - admin user', () => {
    let token
    let user
    test.beforeEach(async ({ restClient }) => {
      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation {
            loginUser(email: "${devUser.email}", password: "${devUser.password}") {
              token
              user {
                  id
                  email
              }
            }
          }`,
          }),
        })
        .then((res) => res.json())

      user = data.loginUser.user
      token = data.loginUser.token
    })

    test('should login', () => {
      expect(user.id).toBeDefined()
      expect(user.email).toEqual(devUser.email)
      expect(token).toBeDefined()
    })

    test('should have fields saved to JWT', () => {
      const decoded = jwtDecode<User>(token)
      const { collection, email: jwtEmail, exp, iat, roles } = decoded

      expect(jwtEmail).toBeDefined()
      expect(collection).toEqual('users')
      expect(Array.isArray(roles)).toBeTruthy()
      expect(iat).toBeDefined()
      expect(exp).toBeDefined()
    })

    test('should not expose strategy on the GraphQL me result', async ({ restClient }) => {
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `query {
              meUser {
                strategy
              }
            }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      expect(result.errors[0].message).toContain('Cannot query field "strategy" on type "usersMe"')
    })

    test('should expose strategy on the GraphQL me user', async ({ restClient }) => {
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `query {
              meUser {
                user {
                  _strategy
                }
              }
            }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      expect(result.data.meUser.user._strategy).toBe('local-jwt')
    })

    test('should not expose strategy on the GraphQL refresh token result', async ({
      restClient,
    }) => {
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation {
              refreshTokenUser {
                strategy
              }
            }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      expect(result.errors[0].message).toContain(
        'Cannot query field "strategy" on type "usersRefreshedUser"',
      )
    })

    test('should expose strategy on the GraphQL refresh token user', async ({ restClient }) => {
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation {
              refreshTokenUser {
                user {
                  _strategy
                }
              }
            }`,
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      expect(result.data.refreshTokenUser.user._strategy).toBe('local-jwt')
    })
  })

  test.describe('REST - admin user', () => {
    test('should prevent registering a new first user', async ({ restClient }) => {
      const response = await restClient.POST(`/${slug}/first-register`, {
        body: JSON.stringify({
          'confirm-password': password,
          email,
          password,
        }),
      })

      expect(response.status).toBe(403)
    })

    test('should login a user successfully', async ({ restClient }) => {
      const response = await restClient.POST(`/${slug}/login`, {
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.collection).toBe(slug)
      expect(data.user._strategy).toBeDefined()
      expect(data.token).toBeDefined()
    })

    test('should not lose data if login throws', async ({ payload, restClient }) => {
      const testEmail = 'transaction-rollback-test@example.com'
      const testPassword = 'test123'
      const originalArrayData = [{ info: 'original-value-1' }, { info: 'original-value-2' }]

      const testUser = await payload.create({
        collection: slug,
        data: {
          email: testEmail,
          loginMetadata: originalArrayData,
          password: testPassword,
          roles: ['user'],
        },
      })

      const userBefore: any = await payload.findByID({
        id: testUser.id,
        collection: slug,
      })
      const sessionCountBefore = userBefore.sessions?.length || 0

      const originalHooks = payload.config.collections.find((c) => c.slug === slug)?.hooks
        ?.beforeLogin
      const throwingHook = () => {
        throw new Error('Simulated failure after session added')
      }

      const collection = payload.config.collections.find((c) => c.slug === slug)
      if (collection) {
        collection.hooks = collection.hooks || {}
        collection.hooks.beforeLogin = [throwingHook]
      }

      const res = await restClient.POST(`/${slug}/login`, {
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
      const data: any = await res.json()
      expect(data.errors).toHaveLength(1)

      // Restore original hooks
      if (collection) {
        if (originalHooks) {
          collection.hooks.beforeLogin = originalHooks
        } else if (collection.hooks) {
          collection.hooks.beforeLogin = []
        }
      }

      const userAfter: any = await payload.findByID({
        id: testUser.id,
        collection: slug,
      })

      expect(userAfter.loginMetadata).toHaveLength(2)
      expect(userAfter.loginMetadata).toMatchObject(originalArrayData)

      const sessionCountAfter = userAfter.sessions?.length || 0
      expect(sessionCountAfter).toBe(sessionCountBefore)

      // Clean up
      await payload.delete({
        id: testUser.id,
        collection: slug,
      })
    })

    test.describe('logged in', () => {
      let token: string | undefined
      let loggedInUser: undefined | User

      test.beforeEach(async ({ restClient }) => {
        const response = await restClient.POST(`/${slug}/login`, {
          body: JSON.stringify({
            email,
            password,
          }),
        })

        const data = await response.json()
        token = data.token
        loggedInUser = data.user
      })

      test('should allow a user to change password without returning password', async ({
        payload,
      }) => {
        const result = await payload.update({
          id: loggedInUser.id,
          collection: slug,
          data: {
            password: 'test',
          },
        })

        expect(result.id).toStrictEqual(loggedInUser.id)
        expect(result.password).toBeUndefined()
      })

      test('should return strategy only on the /me user', async ({ restClient }) => {
        const response = await restClient.GET(`/${slug}/me`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(data).not.toHaveProperty('strategy')
        expect(typeof data.exp).toBe('number')
        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
        expect(data.user._strategy).toBe('local-jwt')
      })

      test('should have custom fields saved to JWT', () => {
        const decoded = jwtDecode<User>(token)
        const {
          collection,
          email: jwtEmail,
          exp,
          iat,
          roles,
          [saveToJWTKey]: customJWTPropertyKey,
          tabLiftedSaveToJWT,
          unnamedTabSaveToJWTFalse,
          'x-lifted-from-group': liftedFromGroup,
          'x-tab-field': unnamedTabSaveToJWTString,
        } = decoded

        const group = decoded['x-group'] as Record<string, unknown>
        const tab = decoded.saveToJWTTab as Record<string, unknown>
        const tabString = decoded['tab-test'] as Record<string, unknown>

        expect(jwtEmail).toBeDefined()
        expect(collection).toEqual('users')
        expect(collection).toEqual('users')
        expect(Array.isArray(roles)).toBeTruthy()
        // 'x-custom-jwt-property-name': 'namedSaveToJWT value'
        expect(customJWTPropertyKey).toEqual(namedSaveToJWTValue)
        expect(group).toBeDefined()
        expect(group['x-test']).toEqual('nested property')
        expect(group.saveToJWTFalse).toBeUndefined()
        expect(liftedFromGroup).toEqual('lifted from group')
        expect(tabLiftedSaveToJWT).toEqual('lifted from unnamed tab')
        expect(tab['x-field']).toEqual('yes')
        expect(tabString.includedByDefault).toEqual('yes')
        expect(unnamedTabSaveToJWTString).toEqual('text')
        expect(unnamedTabSaveToJWTFalse).toBeUndefined()
        expect(iat).toBeDefined()
        expect(exp).toBeDefined()
      })

      test('should not crash when building JWT for user with missing group/tab fields', ({
        payload,
      }) => {
        const collectionConfig = payload.collections[slug].config

        // Simulate a user document that was created before group/tab fields were added.
        // Without the fix, getFieldsToSign would crash with:
        // "TypeError: Cannot read properties of undefined (reading 'saveToJWTString')"
        // when trying to traverse into groupSaveToJWT.saveToJWTString
        const userWithMissingFields = {
          id: '123',
          email: 'test@example.com',
          roles: ['user'],
          // Missing fields: group, groupSaveToJWT, saveToJWTTab, tabSaveToJWTString
        }

        expect(() => {
          getFieldsToSign({
            collectionConfig,
            email: userWithMissingFields.email,
            user: userWithMissingFields as any,
          })
        }).not.toThrow()

        const result = getFieldsToSign({
          collectionConfig,
          email: userWithMissingFields.email,
          user: userWithMissingFields as any,
        })

        expect(result.id).toBe(userWithMissingFields.id)
        expect(result.email).toBe(userWithMissingFields.email)
        expect(result.collection).toBe(slug)
      })

      test('should allow authentication with an API key with useAPIKey', async ({
        payload,
        restClient,
      }) => {
        const apiKey = '0123456789ABCDEFGH'

        const user = await payload.create({
          collection: slug,
          data: {
            apiKey,
            email: 'dev@example.com',
            enableAPIKey: true,
            password: 'test',
          },
        })

        expect(user.apiKey).toStrictEqual(apiKey)

        const response = await restClient.GET(`/${slug}/me`, {
          headers: {
            Authorization: `${slug} API-Key ${apiKey}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
        // Keys are stored as a one-way hash, so a later read only ever returns the mask.
        expect(data.user.apiKey).toStrictEqual('')
      })

      test('should refresh a token and reset its expiration', async ({ restClient }) => {
        const response = await restClient.POST(`/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.refreshedToken).toBeDefined()
      })

      test('should return strategy only on the /refresh-token user', async ({ restClient }) => {
        const response = await restClient.POST(`/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).not.toHaveProperty('strategy')
        expect(data.user._strategy).toBe('local-jwt')
      })

      test('should refresh a token and receive an up-to-date user', async ({
        payload,
        restClient,
      }) => {
        expect(loggedInUser?.custom).toBe('Hello, world!')

        await payload.update({
          id: loggedInUser?.id || '',
          collection: slug,
          data: {
            custom: 'Goodbye, world!',
          },
        })

        const response = await restClient.POST(`/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.custom).toBe('Goodbye, world!')
      })

      test('keeps apiKey hashed in DB after refresh operation', async ({ payload, restClient }) => {
        const apiKey = '987e6543-e21b-12d3-a456-426614174999'
        const user = await payload.create({
          collection: slug,
          data: { apiKey, email: 'user@example.com', enableAPIKey: true, password: 'Password123' },
        })
        const { token } = await payload.login({
          collection: 'users',
          data: { email: 'user@example.com', password: 'Password123' },
        })
        await restClient.POST('/users/refresh-token', {
          headers: { Authorization: `JWT ${token}` },
        })
        const raw = await payload.db.findOne<any>({
          collection: 'users',
          req: { locale: 'en' } as any,
          where: { id: { equals: user.id } },
        })
        expect(raw?.apiKey).toStrictEqual(crypto.createHash('sha256').update(apiKey).digest('hex'))
      })

      test('does not return the apiKey after refresh', async ({ payload, restClient }) => {
        await payload.create({
          collection: slug,
          data: {
            apiKey: '987e6543-e21b-12d3-a456-426614174999',
            email: 'user@example.com',
            enableAPIKey: true,
            password: 'Password123',
          },
        })

        const { token } = await payload.login({
          collection: 'users',
          data: { email: 'user@example.com', password: 'Password123' },
        })

        const res = await restClient
          .POST('/users/refresh-token', {
            headers: { Authorization: `JWT ${token}` },
          })
          .then((r) => r.json())

        expect(res.user.apiKey).toStrictEqual('')
      })

      test('should allow a user to be created', async ({ restClient }) => {
        const response = await restClient.POST(`/${slug}`, {
          body: JSON.stringify({
            email: 'name@test.com',
            password,
            roles: ['editor'],
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data).toHaveProperty('message')
        expect(data).toHaveProperty('doc')

        const { doc } = data

        expect(doc).toHaveProperty('email')
        expect(doc).toHaveProperty('createdAt')
        expect(doc).toHaveProperty('roles')
      })

      test('should allow verification of a user', async ({ payload, restClient }) => {
        const emailToVerify = 'verify@me.com'
        const response = await restClient.POST(`/${publicUsersSlug}`, {
          body: JSON.stringify({
            email: emailToVerify,
            password,
            roles: ['editor'],
          }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        expect(response.status).toBe(201)

        const userResult = await payload.find({
          collection: publicUsersSlug,
          limit: 1,
          showHiddenFields: true,
          where: {
            email: {
              equals: emailToVerify,
            },
          },
        })

        const { _verificationToken, _verified } = userResult.docs[0]

        expect(_verified).toBe(false)
        expect(_verificationToken).toBeDefined()

        const verificationResponse = await restClient.POST(
          `/${publicUsersSlug}/verify/${_verificationToken}`,
        )

        expect(verificationResponse.status).toBe(200)

        const afterVerifyResult = await payload.find({
          collection: publicUsersSlug,
          limit: 1,
          showHiddenFields: true,
          where: {
            email: {
              equals: emailToVerify,
            },
          },
        })

        const { _verificationToken: afterToken, _verified: afterVerified } =
          afterVerifyResult.docs[0]
        expect(afterVerified).toBe(true)
        expect(afterToken).toBeNull()
      })

      test.describe('User Preferences', () => {
        const key = 'test'
        const property = 'store'
        let data

        test.beforeEach(async ({ restClient }) => {
          const response = await restClient.POST(`/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property },
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          data = await response.json()
        })

        test('should create', () => {
          expect(data.doc.key).toStrictEqual(key)
          expect(data.doc.value.property).toStrictEqual(property)
        })

        test('should read', async ({ restClient }) => {
          const response = await restClient.GET(`/payload-preferences/${key}`, {
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          data = await response.json()
          expect(data.key).toStrictEqual(key)
          expect(data.value.property).toStrictEqual(property)
        })

        test('should update', async ({ payload, restClient }) => {
          const response = await restClient.POST(`/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property: 'updated', property2: 'test' },
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          data = await response.json()

          const result = await payload.find({
            collection: 'payload-preferences',
            depth: 0,
            where: {
              and: [
                {
                  key: { equals: key },
                },
                {
                  'user.relationTo': {
                    equals: 'users',
                  },
                },
                {
                  'user.value': {
                    equals: loggedInUser.id,
                  },
                },
              ],
            },
          })

          expect(data.doc.key).toStrictEqual(key)
          expect(data.doc.value.property).toStrictEqual('updated')
          expect(data.doc.value.property2).toStrictEqual('test')

          expect(result.docs).toHaveLength(1)
        })

        test('should only have one preference per user per key', async ({
          payload,
          restClient,
        }) => {
          await restClient.POST(`/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property: 'test', property2: 'test' },
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          await restClient.POST(`/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property: 'updated', property2: 'updated' },
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          const result = await payload.find({
            collection: 'payload-preferences',
            depth: 0,
            where: {
              and: [
                {
                  key: { equals: key },
                },
                {
                  'user.relationTo': {
                    equals: 'users',
                  },
                },
                {
                  'user.value': {
                    equals: loggedInUser.id,
                  },
                },
              ],
            },
          })

          expect((result.docs[0]?.value as any)?.property).toStrictEqual('updated')
          expect((result.docs[0]?.value as any)?.property2).toStrictEqual('updated')

          expect(result.docs).toHaveLength(1)
        })

        test('should delete', async ({ payload, restClient }) => {
          const response = await restClient.DELETE(`/payload-preferences/${key}`, {
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          data = await response.json()

          const result = await payload.find({
            collection: 'payload-preferences',
            depth: 0,
            where: {
              and: [
                {
                  key: { equals: key },
                },
                {
                  'user.relationTo': {
                    equals: 'users',
                  },
                },
                {
                  'user.value': {
                    equals: loggedInUser.id,
                  },
                },
              ],
            },
          })

          expect(result.docs).toHaveLength(0)
        })
      })

      test.describe('Cross-Collection Preference Isolation', () => {
        const adminKey = 'cross-collection-admin'
        const publicKey = 'cross-collection-public'
        let publicUserToken: string
        let publicUserId: number | string
        const createdIDs: (number | string)[] = []

        test.beforeEach(async ({ payload, restClient }) => {
          // Admin creates preference
          const adminPref = await restClient.POST(`/payload-preferences/${adminKey}`, {
            body: JSON.stringify({ value: { data: 'admin-sensitive' } }),
            headers: { Authorization: `JWT ${token}` },
          })
          createdIDs.push((await adminPref.json()).doc.id)

          // Create and verify public user
          const userRes = await restClient.POST(`/${publicUsersSlug}`, {
            body: JSON.stringify({ email: 'crosscollection@test.com', password: 'test123!' }),
            headers: { Authorization: `JWT ${token}` },
          })
          publicUserId = (await userRes.json()).doc.id

          const user = await payload.findByID({
            collection: publicUsersSlug,
            id: publicUserId,
            showHiddenFields: true,
          })
          await restClient.POST(`/${publicUsersSlug}/verify/${(user as any)._verificationToken}`)

          // Login as public user
          const login = await restClient.POST(`/${publicUsersSlug}/login`, {
            body: JSON.stringify({ email: 'crosscollection@test.com', password: 'test123!' }),
          })
          publicUserToken = (await login.json()).token

          // Public user creates preference
          const publicPref = await restClient.POST(`/payload-preferences/${publicKey}`, {
            body: JSON.stringify({ value: { data: 'public-data' } }),
            headers: { Authorization: `JWT ${publicUserToken}` },
          })
          createdIDs.push((await publicPref.json()).doc.id)
        })

        test.afterAll(async ({ payloadInstance }) => {
          await Promise.all(
            createdIDs.map((id) =>
              payloadInstance.delete({ id, collection: 'payload-preferences' }).catch(() => {}),
            ),
          )
          if (publicUserId) {
            await payloadInstance
              .delete({ id: publicUserId, collection: publicUsersSlug })
              .catch(() => {})
          }
        })

        test('should only return own preferences via REST find', async ({ restClient }) => {
          const res = await restClient.GET('/payload-preferences', {
            headers: { Authorization: `JWT ${publicUserToken}` },
          })
          const data: any = await res.json()

          expect(data.docs).toHaveLength(1)
          expect(data.docs[0].user.relationTo).toBe(publicUsersSlug)
          expect(data.docs.some((doc: any) => doc.user.relationTo === 'users')).toBe(false)
        })

        test('should not delete other collection preferences via REST', async ({
          payload,
          restClient,
        }) => {
          const before = await payload.find({
            collection: 'payload-preferences',
            where: { 'user.relationTo': { equals: 'users' } },
          })
          expect(before.docs).toHaveLength(1)

          await restClient.DELETE(`/payload-preferences?where[key][equals]=${adminKey}`, {
            headers: { Authorization: `JWT ${publicUserToken}` },
          })

          const after = await payload.find({
            collection: 'payload-preferences',
            where: { 'user.relationTo': { equals: 'users' } },
          })
          expect(after.docs).toHaveLength(1)
          expect((after.docs[0]?.value as any)?.data).toBe('admin-sensitive')
        })

        test('should isolate preferences by user ID and collection', async ({ payload }) => {
          const publicPrefs = await payload.find({
            collection: 'payload-preferences',
            where: { 'user.relationTo': { equals: publicUsersSlug } },
          })
          expect(publicPrefs.docs).toHaveLength(1)

          const adminPrefs = await payload.find({
            collection: 'payload-preferences',
            where: { 'user.relationTo': { equals: 'users' } },
          })
          expect(adminPrefs.docs).toHaveLength(1)
        })
      })

      test.describe('Account Locking', () => {
        const userEmail = 'lock@me.com'

        const tryLogin = async (
          success?: boolean,
          { restClient }: { restClient: NextRESTClient },
        ) => {
          const res = await restClient.POST(`/${slug}/login`, {
            body: JSON.stringify(
              success
                ? {
                    email: userEmail,
                    password,
                  }
                : {
                    email: userEmail,
                    password: 'bad',
                  },
            ),
          })
          return await res.json()
        }

        test.beforeEach(async ({ restClient }) => {
          const response = await restClient.POST(`/${slug}/login`, {
            body: JSON.stringify({
              email,
              password,
            }),
          })

          const data = await response.json()
          token = data.token

          // New user to lock
          await restClient.POST(`/${slug}`, {
            body: JSON.stringify({
              email: userEmail,
              password,
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
        })

        test.beforeEach(async ({ payload }) => {
          await payload.db.updateOne({
            collection: slug,
            data: {
              lockUntil: null,
              loginAttempts: 0,
            },
            where: {
              email: {
                equals: userEmail,
              },
            },
          })
        })

        const lockedMessage = 'This user is locked due to having too many failed login attempts.'
        const incorrectMessage = 'The email or password provided is incorrect.'

        test('should lock the user after too many attempts', async ({ payload, restClient }) => {
          const user1 = await tryLogin(undefined, { restClient })
          const user2 = await tryLogin(undefined, { restClient })
          const user3 = await tryLogin(undefined, { restClient }) // Let it call multiple times, therefore the unlock condition has no bug.

          expect(user1.errors[0].message).toBe(incorrectMessage)
          expect(user2.errors[0].message).toBe(incorrectMessage)
          expect(user3.errors[0].message).toBe(lockedMessage)

          const userResult = await payload.find({
            collection: slug,
            limit: 1,
            showHiddenFields: true,
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          const { lockUntil, loginAttempts } = userResult.docs[0]!

          expect(loginAttempts).toBe(2)
          expect(lockUntil).toBeDefined()

          const successfulLogin = await tryLogin(true, { restClient })
          expect(successfulLogin.errors?.[0].message).toBe(
            'This user is locked due to having too many failed login attempts.',
          )
        })

        test('should lock the user after too many parallel attempts', async ({
          payload,
          restClient,
        }) => {
          const tryLoginAttempts = 100
          const users = await Promise.allSettled(
            Array.from({ length: tryLoginAttempts }, () => tryLogin(undefined, { restClient })),
          )

          expect(users).toHaveLength(tryLoginAttempts)

          // Expect min. 8 locked message max. 2 incorrect messages.
          const lockedMessages = users.filter(
            (result) =>
              result.status === 'fulfilled' && result.value?.errors?.[0]?.message === lockedMessage,
          )
          const incorrectMessages = users.filter(
            (result) =>
              result.status === 'fulfilled' &&
              result.value?.errors?.[0]?.message === incorrectMessage,
          )

          const userResult = await payload.find({
            collection: slug,
            limit: 1,
            showHiddenFields: true,
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          const { lockUntil, loginAttempts } = userResult.docs[0]!

          // loginAttempts does not have to be exactly the same amount of login attempts. If this ran sequentially, login attempts would stop
          // incrementing after maxLoginAttempts is reached. Since this is run in parallel, it can increment more than maxLoginAttempts, but it is not
          // expected to and can be less depending on the timing.
          expect(loginAttempts).toBeGreaterThan(3)
          expect(lockUntil).toBeDefined()

          expect(incorrectMessages.length).toBeLessThanOrEqual(2)
          expect(lockedMessages.length).toBeGreaterThanOrEqual(tryLoginAttempts - 2)

          const successfulLogin = await tryLogin(true, { restClient })

          expect(successfulLogin.errors?.[0].message).toBe(
            'This user is locked due to having too many failed login attempts.',
          )
        })

        test('ensure that login session expires if max login attempts is reached within narrow time-frame', async ({
          restClient,
        }) => {
          const tryLoginAttempts = 5

          // If there are 100 parallel login attempts, 99 incorrect and 1 correct one, we do not want the correct one to be able to consistently be able
          // to login successfully.
          const user = await tryLogin(true, { restClient })
          const firstMeResponse = await restClient.GET(`/${slug}/me`, {
            headers: {
              Authorization: `JWT ${user.token}`,
            },
          })

          expect(firstMeResponse.status).toBe(200)

          const firstMeData = await firstMeResponse.json()

          expect(firstMeData.token).toBeDefined()
          expect(firstMeData.user.email).toBeDefined()

          await Promise.allSettled(
            Array.from({ length: tryLoginAttempts }, () => tryLogin(undefined, { restClient })),
          )

          const secondMeResponse = await restClient.GET(`/${slug}/me`, {
            headers: {
              Authorization: `JWT ${user.token}`,
            },
          })

          expect(secondMeResponse.status).toBe(200)

          const secondMeData = await secondMeResponse.json()

          expect(secondMeData.user).toBeNull()
          expect(secondMeData.token).not.toBeDefined()
        })

        test('should unlock account once lockUntil period is over', async ({
          payload,
          restClient,
        }) => {
          // Lock user
          await tryLogin(undefined, { restClient })
          await tryLogin(undefined, { restClient })

          const loginAfterLimit = await restClient
            .POST(`/${slug}/login`, {
              body: JSON.stringify({
                email: userEmail,
                password,
              }),
              headers: {
                Authorization: `JWT ${token}`,
                'Content-Type': 'application/json',
              },
              method: 'post',
            })
            .then((res) => res.json())

          expect(loginAfterLimit.errors.length).toBeGreaterThan(0)

          const lockedUser = await payload.find({
            collection: slug,
            showHiddenFields: true,
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          expect(lockedUser.docs[0]!.loginAttempts).toBe(2)
          expect(lockedUser.docs[0]!.lockUntil).toBeDefined()

          const manuallyReleaseLock = new Date(Date.now() - 605 * 1000).toISOString()
          await payload.db.updateOne({
            collection: slug,
            id: lockedUser.docs[0]!.id,
            data: {
              lockUntil: manuallyReleaseLock,
            },
          })

          const userAfterUpdate = await payload.findByID({
            collection: slug,
            id: lockedUser.docs[0]!.id,
            showHiddenFields: true,
          })

          expect(userAfterUpdate.lockUntil).toEqual(manuallyReleaseLock)

          // login
          await restClient.POST(`/${slug}/login`, {
            body: JSON.stringify({
              email: userEmail,
              password,
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          const userResult = await payload.find({
            collection: slug,
            limit: 1,
            showHiddenFields: true,
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          const { lockUntil, loginAttempts } = userResult.docs[0]

          expect(loginAttempts).toBe(0)
          expect(lockUntil).toBeNull()
        })
      })
    })

    test('should allow forgot-password by email', async ({ restClient }) => {
      // TODO: Spy on payload sendEmail function
      const response = await restClient.POST(`/${slug}/forgot-password`, {
        body: JSON.stringify({
          email,
        }),
      })
      // expect(mailSpy).toHaveBeenCalled();

      expect(response.status).toBe(200)
    })

    test('should allow reset password', async ({ payload }) => {
      const token = await payload.forgotPassword({
        collection: 'users',
        data: {
          email: devUser.email,
        },
        disableEmail: true,
      })

      const result = await payload
        .resetPassword({
          collection: 'users',
          data: {
            password: devUser.password,
            token,
          },
          overrideAccess: true,
        })
        .catch((e) => console.error(e))

      expect(result).toBeTruthy()
    })

    test('should enforce access control on the me route', async ({ payload, restClient }) => {
      const user = await payload.create({
        collection: slug,
        data: {
          adminOnlyField: 'admin secret',
          email: 'insecure@me.com',
          password: 'test',
          roles: ['admin'],
        },
      })

      const response = await restClient.POST(`/${slug}/login`, {
        body: JSON.stringify({
          email: 'insecure@me.com',
          password: 'test',
        }),
      })

      const data = await response.json()
      const adminMe = await restClient
        .GET(`/${slug}/me`, {
          headers: {
            Authorization: `JWT ${data.token}`,
          },
        })
        .then((res) => res.json())

      expect(adminMe.user.adminOnlyField).toEqual('admin secret')

      await payload.update({
        id: user?.id || '',
        collection: slug,
        data: {
          roles: ['editor'],
        },
      })

      const editorMe = await restClient
        .GET(`/${slug}/me`, {
          headers: {
            Authorization: `JWT ${data.token}`,
          },
        })
        .then((res) => res.json())
      expect(editorMe.user.adminOnlyField).toBeUndefined()
    })

    test('should not allow refreshing an invalid token', async ({ restClient }) => {
      const response = await restClient.POST(`/${slug}/refresh-token`, {
        body: JSON.stringify({
          token: 'INVALID',
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.token).toBeUndefined()
    })
  })

  test.describe('config defaults', () => {
    test('should default auth.depth to 0 when the collection does not set it', ({ payload }) => {
      expect(payload.collections[publicUsersSlug]?.config.auth.depth).toBe(0)
    })
  })

  test.describe('disableLocalStrategy', () => {
    test('should allow create of a user with disableLocalStrategy', async ({ payload }) => {
      const email = 'test@example.com'
      const user = await payload.create({
        collection: partialDisableLocalStrategiesSlug,
        data: {
          email,
          // password is not required
        },
      })
      expect(user.email).toStrictEqual(email)
    })

    test('should retain fields when auth.disableLocalStrategy.enableFields is true', ({
      payload,
    }) => {
      const authFields = payload.collections[partialDisableLocalStrategiesSlug].config.fields

        .filter((field) => 'name' in field && field.name)
        .map((field) => (field as FieldAffectingData).name)

      expect(authFields).toMatchObject([
        'updatedAt',
        'createdAt',
        'email',
        'resetPasswordToken',
        'resetPasswordExpiration',
        'salt',
        'hash',
        'loginAttempts',
        'lockUntil',
        'sessions',
      ])
    })

    test('should prevent login of user with disableLocalStrategy.', async ({ payload }) => {
      await payload.create({
        collection: partialDisableLocalStrategiesSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      await expect(
        payload.login({
          collection: partialDisableLocalStrategiesSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('rest - should prevent login', async ({ restClient }) => {
      const response = await restClient.POST(`/${partialDisableLocalStrategiesSlug}/login`, {
        body: JSON.stringify({
          email,
          password,
        }),
      })

      expect(response.status).toBe(403)
    })

    test('should allow to use password field', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'disable-local-strategy-password',
        data: { password: '123' },
      })
      expect(doc.password).toBe('123')
      const updated = await payload.update({
        id: doc.id,
        collection: 'disable-local-strategy-password',
        data: { password: '1234' },
      })
      expect(updated.password).toBe('1234')
    })
  })

  test.describe('API Key', () => {
    test('should authenticate via the correct API key user', async ({ payload, restClient }) => {
      const [user1, user2] = await Promise.all([
        payload.create({
          collection: apiKeysSlug,
          data: { apiKey: 'first-users-own-api-key', enableAPIKey: true },
        }),
        payload.create({
          collection: apiKeysSlug,
          data: { apiKey: 'second-users-own-api-key', enableAPIKey: true },
        }),
      ])

      const success = await restClient
        .GET(`/${apiKeysSlug}/${user2.id}`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${user2.apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(success.id).toStrictEqual(user2.id)

      const fail = await restClient.GET(`/${apiKeysSlug}/${user1.id}`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${user2.apiKey}`,
        },
      })

      expect(fail.status).toStrictEqual(404)
    })

    test('should not remove an API key from a user when updating other fields', async ({
      payload,
      restClient,
    }) => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        },
      })

      await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(response.user.id).toStrictEqual(user.id)
    })

    test('should disable api key after updating apiKey: null', async ({ payload, restClient }) => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        },
      })

      const updatedUser = await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          apiKey: null,
        },
      })

      // use the api key in a fetch to assert that it is disabled
      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(updatedUser.apiKey).toBeNull()
      expect(response.user).toBeNull()
    })

    test('should disable api key after updating with enableAPIKey:false', async ({
      payload,
      restClient,
    }) => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey,
          enableAPIKey: true,
        },
      })

      const updatedUser = await payload.update({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          enableAPIKey: false,
        },
      })

      // use the api key in a fetch to assert that it is disabled
      const response = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(updatedUser.apiKey).toBeNull()
      expect(response.user).toBeNull()
    })
  })

  test.describe('API Key hashing', () => {
    const hashOf = (rawAPIKey: string) =>
      crypto.createHash('sha256').update(rawAPIKey).digest('hex')

    const readRawRow = async ({
      id,
      collection,
      payload,
    }: {
      collection: string
      id: number | string
      payload: Payload
    }) =>
      (await payload.db.findOne<any>({
        collection,
        req: { locale: 'en' } as any,
        where: { id: { equals: id } },
      })) as null | Record<string, unknown>

    /**
     * Reads apiKeyProofSlug, which only an api-key authenticated user of apiKeyOnlySlug can
     * reach, so a pass cannot come from ambient access - then confirms which user the key
     * belongs to through that collection's own `/me`.
     */
    const expectAPIKeyWorks = async ({
      id,
      apiKey,
      restClient,
    }: {
      apiKey: string
      id: number | string
      restClient: NextRESTClient
    }) => {
      const headers = { Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` }

      const proof = await restClient.GET(`/${apiKeyProofSlug}`, { headers })
      expect(proof.status).toStrictEqual(200)

      const me = await restClient
        .GET(`/${apiKeyOnlySlug}/me`, { headers })
        .then((res) => res.json())
      expect(me.user?.id).toStrictEqual(id)
    }

    const expectAPIKeyRejected = async ({
      apiKey,
      restClient,
    }: {
      apiKey: string
      id?: number | string
      restClient: NextRESTClient
    }) => {
      const headers = { Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` }

      const proof = await restClient.GET(`/${apiKeyProofSlug}`, { headers })
      expect(proof.status).not.toStrictEqual(200)

      const me = await restClient
        .GET(`/${apiKeyOnlySlug}/me`, { headers })
        .then((res) => res.json())
      expect(me.user).toBeNull()
    }

    test('should store a one-way hash of a supplied key', async ({ payload }) => {
      const apiKey = 'supplied-key-stored-as-a-hash'

      const user = await payload.create({
        collection: apiKeysSlug,
        data: { apiKey, enableAPIKey: true },
      })

      const raw = await readRawRow({ id: user.id, collection: apiKeysSlug, payload })

      expect(raw?.apiKey).toStrictEqual(hashOf(apiKey))
      expect(raw?.apiKeyIndex).toBeFalsy()
    })

    test('should authenticate with a supplied key', async ({ payload, restClient }) => {
      expect.hasAssertions()

      const apiKey = 'supplied-key-that-should-authenticate'

      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { apiKey, enableAPIKey: true },
      })

      await expectAPIKeyWorks({ id: user.id, apiKey, restClient })
      await expectAPIKeyRejected({ id: user.id, apiKey: 'not-the-right-key', restClient })
    })

    test('should authenticate a key stored without any secret involvement', async ({
      payload,
      restClient,
    }) => {
      expect.hasAssertions()

      const apiKey = 'key-hashed-outside-of-payload-entirely'

      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      // Written at the database layer, so nothing derived from payload.secret is involved.
      await payload.db.updateOne({
        id: user.id,
        collection: apiKeyOnlySlug,
        data: { apiKey: hashOf(apiKey) },
        returning: false,
      })

      await expectAPIKeyWorks({ id: user.id, apiKey, restClient })
    })

    test('should reject a stored hash when API keys are disabled', async ({
      payload,
      restClient,
    }) => {
      expect.hasAssertions()

      const apiKey = 'hashed-key-on-a-disabled-user'
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: false },
      })

      await payload.db.updateOne({
        id: user.id,
        collection: apiKeyOnlySlug,
        data: { apiKey: hashOf(apiKey), enableAPIKey: false },
        returning: false,
      })

      await expectAPIKeyRejected({ apiKey, restClient })
    })

    test('should generate a key on create when none is supplied', async ({
      payload,
      restClient,
    }) => {
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      expect(typeof user.apiKey).toStrictEqual('string')
      expect(Buffer.from(user.apiKey as string, 'base64url')).toHaveLength(32)

      const raw = await readRawRow({ id: user.id, collection: apiKeyOnlySlug, payload })

      expect(raw?.apiKey).toStrictEqual(hashOf(user.apiKey as string))

      await expectAPIKeyWorks({ id: user.id, apiKey: user.apiKey as string, restClient })
    })

    test('should generate a key when enabling on an existing document with no key', async ({
      payload,
      restClient,
    }) => {
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: false },
      })

      expect(user.apiKey).toBeFalsy()

      const updated = await payload.update({
        id: user.id,
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      expect(typeof updated.apiKey).toStrictEqual('string')

      await expectAPIKeyWorks({ id: user.id, apiKey: updated.apiKey as string, restClient })
    })

    test('should not generate a key when API keys are not enabled', async ({ payload }) => {
      const user = await payload.create({
        collection: apiKeysSlug,
        data: { enableAPIKey: false },
      })

      expect(user.apiKey).toBeFalsy()

      const raw = await readRawRow({ id: user.id, collection: apiKeysSlug, payload })

      expect(raw?.apiKey).toBeFalsy()
    })

    test('should only return a generated key in the response that generated it', async ({
      payload,
      restClient,
    }) => {
      const created = await payload.create({
        collection: apiKeysSlug,
        data: { enableAPIKey: true },
      })

      expect(created.apiKey).toBeTruthy()

      // A set key reads back masked, never as the stored hash and never as the key itself.
      const foundByID = await payload.findByID({ id: created.id, collection: apiKeysSlug })
      expect(foundByID.apiKey).toStrictEqual('')

      const found = await payload.find({
        collection: apiKeysSlug,
        where: { id: { equals: created.id } },
      })
      expect(found.docs[0]?.apiKey).toStrictEqual('')

      const viaRest = await restClient
        .GET(`/${apiKeysSlug}/${created.id}`, {
          headers: { Authorization: `${apiKeysSlug} API-Key ${created.apiKey}` },
        })
        .then((res) => res.json())
      expect(viaRest.apiKey).toStrictEqual('')

      const viaGraphQL = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `query {
              ApiKey(id: ${JSON.stringify(created.id)}) {
                apiKey
              }
            }`,
          }),
          headers: { Authorization: `${apiKeysSlug} API-Key ${created.apiKey}` },
        })
        .then((res) => res.json())
      expect(viaGraphQL.errors).toBeUndefined()
      expect(viaGraphQL.data.ApiKey.apiKey).toStrictEqual('')

      const viaMe = await restClient
        .GET(`/${apiKeysSlug}/me`, {
          headers: { Authorization: `${apiKeysSlug} API-Key ${created.apiKey}` },
        })
        .then((res) => res.json())
      expect(viaMe.user.id).toStrictEqual(created.id)
      expect(viaMe.user.apiKey).toStrictEqual('')
    })

    test('should mask a stored key when hidden fields are requested', async ({ payload }) => {
      const created = await payload.create({
        collection: apiKeysSlug,
        data: { apiKey: 'key-that-must-stay-hidden', enableAPIKey: true },
      })

      const foundByID = await payload.findByID({
        id: created.id,
        collection: apiKeysSlug,
        showHiddenFields: true,
      })

      expect(foundByID.apiKey).toStrictEqual('')
    })

    test('should mask a stored key in a login response', async ({ payload }) => {
      const loginEmail = `api-key-login-${uuid()}@example.com`
      const loginPassword = 'Password123'

      await payload.create({
        collection: slug,
        data: {
          apiKey: 'key-that-must-not-be-returned-by-login',
          email: loginEmail,
          enableAPIKey: true,
          password: loginPassword,
        },
      })

      const { user } = await payload.login({
        collection: slug,
        data: { email: loginEmail, password: loginPassword },
      })

      expect(user.apiKey).toStrictEqual('')
    })

    test('should keep the key when other fields are updated', async ({ payload, restClient }) => {
      expect.hasAssertions()

      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      const apiKey = user.apiKey as string

      await payload.update({
        id: user.id,
        collection: apiKeyOnlySlug,
        data: { label: 'renamed' },
      })

      await expectAPIKeyWorks({ id: user.id, apiKey, restClient })
    })

    test('should generate a distinct key per document in a bulk update', async ({
      payload,
      restClient,
    }) => {
      const first = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: false, label: 'bulk' },
      })
      const second = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: false, label: 'bulk' },
      })

      const { docs } = await payload.update({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
        where: { label: { equals: 'bulk' } },
      })

      expect(docs).toHaveLength(2)

      const keysByID = new Map(docs.map((doc) => [doc.id, doc.apiKey as string]))

      expect(new Set(keysByID.values()).size).toStrictEqual(2)

      for (const id of [first.id, second.id]) {
        await expectAPIKeyWorks({ id, apiKey: keysByID.get(id)!, restClient })
      }
    })

    test('should ignore a supplied key when field update access is denied', async ({ payload }) => {
      const user = await payload.create({
        collection: apiKeysWithFieldUpdateAccessSlug,
        data: { apiKey: 'original-key-set-with-override-access', enableAPIKey: true },
      })

      const before = await readRawRow({
        id: user.id,
        collection: apiKeysWithFieldUpdateAccessSlug,
        payload,
      })

      await payload.update({
        id: user.id,
        collection: apiKeysWithFieldUpdateAccessSlug,
        data: { apiKey: 'a-key-the-caller-is-not-allowed-to-set' },
        overrideAccess: false,
      })

      const after = await readRawRow({
        id: user.id,
        collection: apiKeysWithFieldUpdateAccessSlug,
        payload,
      })

      expect(after?.apiKey).toStrictEqual(before?.apiKey)
    })

    test('should issue a new key rather than copying one when duplicating', async ({
      payload,
      restClient,
    }) => {
      const apiKey = 'the-original-users-key-that-must-not-be-copied'
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { apiKey, enableAPIKey: true },
      })

      const duplicate = await payload.duplicate({
        id: user.id,
        collection: apiKeyOnlySlug,
      })

      // One credential for two users would let either act as the other, so the duplicate
      // must hold a different key entirely.
      const originalRow = await readRawRow({ id: user.id, collection: apiKeyOnlySlug, payload })
      const duplicateRow = await readRawRow({
        id: duplicate.id,
        collection: apiKeyOnlySlug,
        payload,
      })

      expect(duplicateRow?.apiKey).toBeTruthy()
      expect(duplicateRow?.apiKey).not.toStrictEqual(originalRow?.apiKey)

      // The original key still authenticates as its own user.
      await expectAPIKeyWorks({ id: user.id, apiKey, restClient })

      // The duplicate has API keys enabled, so it was issued its own working key.
      expect(duplicate.enableAPIKey).toStrictEqual(true)
      expect(duplicate.apiKey).toBeTruthy()
      expect(duplicate.apiKey).not.toStrictEqual(apiKey)

      await expectAPIKeyWorks({
        id: duplicate.id,
        apiKey: duplicate.apiKey as string,
        restClient,
      })
    })

    test('should not authenticate a key left in the pre-hash encrypted format', async ({
      payload,
      restClient,
    }) => {
      expect.hasAssertions()

      const apiKey = 'key-stored-the-old-encrypted-way'

      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      await payload.db.updateOne({
        id: user.id,
        collection: apiKeyOnlySlug,
        data: {
          apiKey: payload.encrypt(apiKey),
          apiKeyIndex: crypto.createHmac('sha256', payload.secret).update(apiKey).digest('hex'),
        },
        returning: false,
      })

      await expectAPIKeyRejected({ id: user.id, apiKey, restClient })
    })
  })

  test.describe('Generate API key endpoint', () => {
    const generate = async ({
      id,
      collection,
      headers,
      restClient,
    }: {
      collection: string
      headers?: Record<string, string>
      id: number | string
      restClient: NextRESTClient
    }) => restClient.POST(`/${collection}/${id}/api-key`, { headers })

    test('should issue a working key and invalidate the previous one', async ({
      payload,
      restClient,
    }) => {
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { apiKey: 'the-key-that-is-about-to-be-replaced', enableAPIKey: true },
      })

      const response = await generate({
        id: user.id,
        collection: apiKeyOnlySlug,
        restClient,
      })

      expect(response.status).toStrictEqual(200)

      const { apiKey, doc } = await response.json()

      expect(typeof apiKey).toStrictEqual('string')
      expect(apiKey).not.toStrictEqual('the-key-that-is-about-to-be-replaced')
      expect(doc.id).toStrictEqual(user.id)

      const withNewKey = await restClient.GET(`/${apiKeyOnlySlug}/${user.id}`, {
        headers: { Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` },
      })
      expect(withNewKey.status).toStrictEqual(200)

      const withOldKey = await restClient.GET(`/${apiKeyOnlySlug}/${user.id}`, {
        headers: {
          Authorization: `${apiKeyOnlySlug} API-Key the-key-that-is-about-to-be-replaced`,
        },
      })
      expect(withOldKey.status).not.toStrictEqual(200)
    })

    test('should enable API keys when they were disabled', async ({ payload, restClient }) => {
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: false },
      })

      const { apiKey } = await generate({
        id: user.id,
        collection: apiKeyOnlySlug,
        restClient,
      }).then((res) => res.json())

      const updated = await payload.findByID({ id: user.id, collection: apiKeyOnlySlug })
      expect(updated.enableAPIKey).toStrictEqual(true)

      const authenticated = await restClient.GET(`/${apiKeyOnlySlug}/${user.id}`, {
        headers: { Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` },
      })
      expect(authenticated.status).toStrictEqual(200)
    })

    test('should not return the key on a later read of the document', async ({
      payload,
      restClient,
    }) => {
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })

      await generate({ id: user.id, collection: apiKeyOnlySlug, restClient })

      const read = await payload.findByID({ id: user.id, collection: apiKeyOnlySlug })

      // Masked, so a later read reveals neither the key nor the stored hash.
      expect(read.apiKey).toStrictEqual('')
    })

    test('should be refused without update access to the document', async ({
      payload,
      restClient,
    }) => {
      // apiKeysSlug has no `update` access rule, so the default applies and an
      // unauthenticated request cannot update the document.
      const user = await payload.create({
        collection: apiKeysSlug,
        data: { enableAPIKey: true },
      })

      const response = await generate({
        id: user.id,
        collection: apiKeysSlug,
        restClient,
      })

      expect(response.status).toStrictEqual(403)
    })

    test('should be refused when field update access denies apiKey', async ({
      payload,
      restClient,
    }) => {
      const user = await payload.create({
        collection: apiKeysWithFieldUpdateAccessSlug,
        data: { apiKey: 'a-key-that-must-not-be-replaced', enableAPIKey: true },
      })

      const response = await generate({
        id: user.id,
        collection: apiKeysWithFieldUpdateAccessSlug,
        restClient,
      })

      expect(response.status).toStrictEqual(403)

      const stillWorks = await restClient.GET(`/${apiKeysWithFieldUpdateAccessSlug}/${user.id}`, {
        headers: {
          Authorization: `${apiKeysWithFieldUpdateAccessSlug} API-Key a-key-that-must-not-be-replaced`,
        },
      })
      expect(stillWorks.status).toStrictEqual(200)
    })

    test('should 404 for a document that does not exist', async ({ payload, restClient }) => {
      // Create then delete, so the id is always the right shape for the adapter under test.
      const user = await payload.create({
        collection: apiKeyOnlySlug,
        data: { enableAPIKey: true },
      })
      await payload.delete({ id: user.id, collection: apiKeyOnlySlug })

      const response = await generate({
        id: user.id,
        collection: apiKeyOnlySlug,
        restClient,
      })

      expect(response.status).toStrictEqual(404)
    })

    test('should not exist on a collection without useAPIKey', async ({ payload, restClient }) => {
      const user = await payload.create({
        collection: partialDisableLocalStrategiesSlug,
        data: { email: 'no-api-keys@example.com', password: 'test' },
      })

      const response = await generate({
        id: user.id,
        collection: partialDisableLocalStrategiesSlug,
        restClient,
      })

      expect(response.status).toStrictEqual(404)
    })
  })

  test.describe('Local API', () => {
    test('should login via the local API', async ({ payload }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      expect(authenticated.token).toBeTruthy()
    })

    test('should return collection property on user documents', async ({ payload }) => {
      const testEmail = `collection-test-${Date.now()}@example.com`

      const createdUser = await payload.create({
        collection: slug,
        data: {
          email: testEmail,
          password: 'test',
          roles: ['user'],
        },
      })

      expect(createdUser.collection).toBe(slug)

      const foundUser = await payload.findByID({
        id: createdUser.id,
        collection: slug,
      })

      expect(foundUser.collection).toBe(slug)

      const foundUsers = await payload.find({
        collection: slug,
        where: { id: { equals: createdUser.id } },
      })

      expect(foundUsers.docs[0]?.collection).toBe(slug)

      const updatedUser = await payload.update({
        id: createdUser.id,
        collection: slug,
        data: { roles: ['admin'] },
      })

      expect(updatedUser.collection).toBe(slug)

      const deletedUser = await payload.delete({
        id: createdUser.id,
        collection: slug,
      })

      expect(deletedUser.collection).toBe(slug)
    })

    test('should return collection property on api-keys auth collection', async ({ payload }) => {
      const createdApiKey = await payload.create({
        collection: apiKeysSlug,
        data: {
          enableAPIKey: true,
        },
      })

      expect(createdApiKey.collection).toBe(apiKeysSlug)

      const foundApiKey = await payload.findByID({
        id: createdApiKey.id,
        collection: apiKeysSlug,
      })

      expect(foundApiKey.collection).toBe(apiKeysSlug)

      const foundApiKeys = await payload.find({
        collection: apiKeysSlug,
        where: { id: { equals: createdApiKey.id } },
      })

      expect(foundApiKeys.docs[0]?.collection).toBe(apiKeysSlug)

      const updatedApiKey = await payload.update({
        id: createdApiKey.id,
        collection: apiKeysSlug,
        data: { enableAPIKey: false },
      })

      expect(updatedApiKey.collection).toBe(apiKeysSlug)

      const deletedApiKey = await payload.delete({
        id: createdApiKey.id,
        collection: apiKeysSlug,
      })

      expect(deletedApiKey.collection).toBe(apiKeysSlug)
    })

    test('should forget and reset password', async ({ payload }) => {
      const forgot = await payload.forgotPassword({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
        },
      })

      const reset = await payload.resetPassword({
        collection: 'users',
        data: {
          password: 'test',
          token: forgot,
        },
        overrideAccess: true,
      })

      expect(reset.user.email).toStrictEqual('dev@payloadcms.com')
    })

    test('should not allow reset password if forgotPassword expiration token is expired', async ({
      payload,
    }) => {
      // Mock Date.now() to simulate the forgotPassword call happening 6 minutes ago (current expiration is set to 5 minutes)
      const originalDateNow = Date.now
      const mockDateNow = vitest.spyOn(Date, 'now').mockImplementation(() => {
        // Move the current time back by 6 minutes (360,000 ms)
        return originalDateNow() - 6 * 60 * 1000
      })

      let forgot
      try {
        // Call forgotPassword while the mocked Date.now() is active
        forgot = await payload.forgotPassword({
          collection: 'users',
          data: {
            email: 'dev@payloadcms.com',
          },
        })
      } finally {
        // Restore the original Date.now() after the forgotPassword call
        mockDateNow.mockRestore()
      }

      // Attempt to reset password, which should fail because the token is expired
      await expect(
        payload.resetPassword({
          collection: 'users',
          data: {
            password: 'test',
            token: forgot,
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow('Token is either invalid or has expired.')
    })

    test.describe('Login Attempts', () => {
      async function attemptLogin(
        email: string,
        password: string,
        { payload }: { payload: Payload },
      ) {
        return payload.login({
          collection: slug,
          data: {
            email,
            password,
          },
          overrideAccess: false,
        })
      }

      test('should reset the login attempts after a successful login', async ({ payload }) => {
        // fail 1
        await expect(attemptLogin(devUser.email, 'wrong-password', { payload })).rejects.toThrow(
          'The email or password provided is incorrect.',
        )

        // successful login 1
        const successfulLogin = await attemptLogin(devUser.email, devUser.password, { payload })
        expect(successfulLogin).toBeDefined()

        // fail 2
        await expect(attemptLogin(devUser.email, 'wrong-password', { payload })).rejects.toThrow(
          'The email or password provided is incorrect.',
        )

        // successful login 2 without exceeding attempts
        const successfulLogin2 = await attemptLogin(devUser.email, devUser.password, { payload })
        expect(successfulLogin2).toBeDefined()

        const user = await payload.findByID({
          id: successfulLogin2.user.id,
          collection: slug,
          overrideAccess: true,
          showHiddenFields: true,
        })

        expect(user.loginAttempts).toBe(0)
        expect(user.lockUntil).toBeNull()
      })

      test('should lock the user after too many failed login attempts', async ({ payload }) => {
        const now = new Date()
        // fail 1
        await expect(attemptLogin(devUser.email, 'wrong-password', { payload })).rejects.toThrow(
          'The email or password provided is incorrect.',
        )

        // fail 2
        await expect(attemptLogin(devUser.email, 'wrong-password', { payload })).rejects.toThrow(
          'The email or password provided is incorrect.',
        )

        // fail 3
        await expect(attemptLogin(devUser.email, 'wrong-password', { payload })).rejects.toThrow(
          'This user is locked due to having too many failed login attempts.',
        )

        const userQuery = await payload.find({
          collection: slug,
          overrideAccess: true,
          showHiddenFields: true,
          where: {
            email: {
              equals: devUser.email,
            },
          },
        })

        expect(userQuery.docs[0]).toBeDefined()

        const user = userQuery.docs[0]
        expect(user!.loginAttempts).toBe(2)
        expect(user!.lockUntil).toBeDefined()
        expect(typeof user!.lockUntil).toBe('string')
        expect(new Date(user!.lockUntil).getTime()).toBeGreaterThan(now.getTime())
      })

      test('should allow force unlocking of a user', async ({ payload }) => {
        await payload.db.updateOne({
          collection: slug,
          data: {
            lockUntil: new Date(Date.now() + 60_000).toISOString(),
            loginAttempts: 2,
          },
          where: {
            email: {
              equals: devUser.email,
            },
          },
        })

        await payload.unlock({
          collection: slug,
          data: {
            email: devUser.email,
          } as any,
          overrideAccess: true,
        })

        const userQuery = await payload.find({
          collection: slug,
          overrideAccess: true,
          showHiddenFields: true,
          where: {
            email: {
              equals: devUser.email,
            },
          },
        })

        expect(userQuery.docs[0]).toBeDefined()

        const user = userQuery.docs[0]
        expect(user!.loginAttempts).toBe(0)
        expect(user!.lockUntil).toBeNull()
      })
    })
  })

  test.describe('Email - format validation', () => {
    const mockT = vitest.fn((key) => key) // Mocks translation function

    const mockContext: Parameters<EmailFieldValidation>[1] = {
      // @ts-expect-error: Mocking context for email validation
      blockData: {},
      data: {},
      path: ['email'],
      preferences: { fields: {} },
      req: {
        payload: {
          collections: {} as Record<string, never>,
          config: {} as SanitizedConfig,
        } as unknown as BasePayload,
        t: mockT,
      },
      required: true,
      siblingData: {},
    }
    test('should allow standard formatted emails', () => {
      expect(emailValidation('user@example.com', mockContext)).toBe(true)
      expect(emailValidation('user.name+alias@example.co.uk', mockContext)).toBe(true)
      expect(emailValidation('user-name@example.org', mockContext)).toBe(true)
      expect(emailValidation('user@ex--ample.com', mockContext)).toBe(true)
      expect(emailValidation("user'payload@example.org", mockContext)).toBe(true)
    })

    test('should not allow emails with double quotes', () => {
      expect(emailValidation('"user"@example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@"example.com"', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('"user@example.com"', mockContext)).toBe('validation:emailAddress')
    })

    test('should not allow emails with spaces', () => {
      expect(emailValidation('user @example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@ example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user name@example.com', mockContext)).toBe('validation:emailAddress')
    })

    test('should not allow emails with consecutive dots', () => {
      expect(emailValidation('user..name@example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example..com', mockContext)).toBe('validation:emailAddress')
    })

    test('should not allow emails with invalid domains', () => {
      expect(emailValidation('user@example', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example..com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example.c', mockContext)).toBe('validation:emailAddress')
    })

    test('should not allow domains starting or ending with a hyphen', () => {
      expect(emailValidation('user@-example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example-.com', mockContext)).toBe('validation:emailAddress')
    })
    test('should not allow emails that start with dot', () => {
      expect(emailValidation('.user@example.com', mockContext)).toBe('validation:emailAddress')
    })
    test('should not allow emails that have a comma', () => {
      expect(emailValidation('user,name@example.com', mockContext)).toBe('validation:emailAddress')
    })
  })

  test.describe('Sessions', () => {
    test('should set a session on a user', async ({ payload }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      expect(authenticated.token).toBeTruthy()

      const user = await payload.db.find<User>({
        collection: slug,
        where: {
          id: {
            equals: authenticated.user.id,
          },
        },
      })

      expect(Array.isArray(user.docs[0]?.sessions)).toBeTruthy()

      const decoded = jwtDecode<{ sid: string }>(String(authenticated.token))

      expect(decoded.sid).toBeDefined()

      const matchedSession = user.docs[0]?.sessions?.find(({ id }) => id === decoded.sid)

      expect(matchedSession).toBeDefined()
      expect(matchedSession?.createdAt).toBeDefined()
      expect(matchedSession?.expiresAt).toBeDefined()
    })

    test('should log out a user and delete only the session being logged out', async ({
      payload,
      restClient,
    }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const authenticated2 = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      await restClient.POST(`/${slug}/logout`, {
        headers: {
          Authorization: `JWT ${authenticated.token}`,
        },
      })

      const user = await payload.db.find<User>({
        collection: slug,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      const decoded = jwtDecode<{ sid: string }>(String(authenticated.token))
      expect(decoded.sid).toBeDefined()

      const remainingSessions = user.docs[0]?.sessions ?? []

      const loggedOutSession = remainingSessions.find(({ id }) => id === decoded.sid)
      expect(loggedOutSession).toBeUndefined()

      const decoded2 = jwtDecode<{ sid: string }>(String(authenticated2.token))
      expect(decoded2.sid).toBeDefined()

      const existingSession = remainingSessions.find(({ id }) => id === decoded2.sid)
      expect(existingSession?.id).toStrictEqual(decoded2.sid)
    })

    test('should refresh an existing session', async ({ payload, restClient }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const decoded = jwtDecode<{ sid: string }>(String(authenticated.token))

      const user = await payload.db.find<User>({
        collection: slug,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      const matchedSession = user.docs[0]?.sessions?.find(({ id }) => id === decoded.sid)

      const refreshed = await restClient
        .POST(`/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${authenticated.token}`,
          },
        })
        .then((res) => res.json())

      const refreshedUser = await payload.db.find<User>({
        collection: slug,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      const decodedRefreshed = jwtDecode<{ sid: string }>(String(refreshed.refreshedToken))

      const matchedRefreshedSession = refreshedUser.docs[0]?.sessions?.find(
        ({ id }) => id === decodedRefreshed.sid,
      )

      expect(decodedRefreshed.sid).toStrictEqual(decoded.sid)

      expect(new Date(matchedSession?.expiresAt as unknown as string).getTime()).toBeLessThan(
        new Date(matchedRefreshedSession?.expiresAt as unknown as string).getTime(),
      )
    })

    test('should reject a refresh when its session is revoked after authentication', async ({
      payload,
      restClient,
    }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      const { sid } = jwtDecode<{ sid: string }>(String(authenticated.token))

      const logoutResponse = await restClient.POST(`/${slug}/logout`, {
        headers: {
          Authorization: `JWT ${authenticated.token}`,
        },
      })
      const req = await createLocalReq(
        {
          user: {
            ...authenticated.user,
            _sid: sid,
          },
        },
        payload,
      )

      expect(logoutResponse.status).toBe(200)
      await expect(
        refreshOperation({
          collection: payload.collections[slug],
          req,
        }),
      ).rejects.toBeInstanceOf(Forbidden)
    })

    test('should not authenticate a user who has a JWT but its session has been terminated', async ({
      payload,
      restClient,
    }) => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      await restClient.POST(`/${slug}/logout?allSessions=true`, {
        headers: {
          Authorization: `JWT ${authenticated.token}`,
        },
      })

      const user = await payload.db.find<User>({
        collection: slug,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      const remainingSessions = user.docs[0]?.sessions
      expect(remainingSessions).toHaveLength(0)

      const meQuery = await restClient
        .GET(`/${slug}/me`, {
          headers: {
            Authorization: `JWT ${authenticated.token}`,
          },
        })
        .then((res) => res.json())

      expect(meQuery.user).toBeNull()
    })

    test('should clean up expired sessions when logging in', async ({ payload }) => {
      const userWithExpiredSession = await payload.create({
        collection: slug,
        data: {
          email: `${devUser.email}.au`,
          password: devUser.password,
          roles: ['admin'],
          sessions: [
            {
              id: uuid(),
              createdAt: new Date().toDateString(),
              expiresAt: new Date(new Date().getTime() - 5000).toDateString(), // Set an expired session
            },
          ],
        },
      })

      expect(userWithExpiredSession.sessions).toHaveLength(1)

      await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      const user2 = await payload.db.find<User>({
        collection: slug,
        where: {
          email: {
            equals: devUser.email,
          },
        },
      })

      expect(user2.docs[0]?.sessions).toHaveLength(1)
    })

    test('should not update updatedAt when creating a session', async ({ payload }) => {
      // Create a user
      const testUser = await payload.create({
        collection: slug,
        data: {
          email: `test.updatedAt.${Date.now()}@example.com`,
          password: 'test123',
          roles: ['admin'],
        },
      })

      const originalUpdatedAt = testUser.updatedAt

      // Wait a moment to ensure timestamps would differ if updated
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Login to create a session
      await payload.login({
        collection: slug,
        data: {
          email: testUser.email,
          password: 'test123',
        },
      })

      // Fetch the user to check updatedAt
      const userAfterLogin = await payload.db.findOne<User>({
        collection: slug,
        where: {
          id: {
            equals: testUser.id,
          },
        },
      })

      // updatedAt should not have changed
      expect(userAfterLogin?.updatedAt).toEqual(originalUpdatedAt)
      expect(Array.isArray(userAfterLogin?.sessions)).toBeTruthy()
      expect(userAfterLogin?.sessions?.length).toBeGreaterThan(0)
    })

    test('should not update updatedAt when logging out', async ({ payload, restClient }) => {
      // Create and login
      const testUser = await payload.create({
        collection: slug,
        data: {
          email: `test.logout.${Date.now()}@example.com`,
          password: 'test123',
          roles: ['admin'],
        },
      })

      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const userAfterLogin = await payload.db.findOne<User>({
        collection: slug,
        where: {
          id: {
            equals: testUser.id,
          },
        },
      })

      const updatedAtAfterLogin = userAfterLogin?.updatedAt

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Logout
      await restClient.POST(`/${slug}/logout`, {
        headers: {
          Authorization: `JWT ${authenticated.token}`,
        },
      })

      // Fetch the user to check updatedAt
      const userAfterLogout = await payload.db.findOne<User>({
        collection: slug,
        where: {
          id: {
            equals: testUser.id,
          },
        },
      })

      // updatedAt should not have changed
      expect(userAfterLogout?.updatedAt).toEqual(updatedAtAfterLogin)
    })

    test('should not update updatedAt when refreshing a session', async ({
      payload,
      restClient,
    }) => {
      // Create and login
      const testUser = await payload.create({
        collection: slug,
        data: {
          email: `test.refresh.${Date.now()}@example.com`,
          password: 'test123',
          roles: ['admin'],
        },
      })

      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const userAfterLogin = await payload.db.findOne<User>({
        collection: slug,
        where: {
          id: {
            equals: testUser.id,
          },
        },
      })

      const updatedAtAfterLogin = userAfterLogin?.updatedAt

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Refresh token
      await restClient.POST(`/${slug}/refresh-token`, {
        headers: {
          Authorization: `JWT ${authenticated.token}`,
        },
      })

      // Fetch the user to check updatedAt
      const userAfterRefresh = await payload.db.findOne<User>({
        collection: slug,
        where: {
          id: {
            equals: testUser.id,
          },
        },
      })

      // updatedAt should not have changed
      expect(userAfterRefresh?.updatedAt).toEqual(updatedAtAfterLogin)
    })
  })

  test.describe('migrateAPIKeysToHash - converting pre-hash API keys', () => {
    const OLD_SECRET = rotateSecretOldSecret
    const UNKNOWN_SECRET = 'a-secret-that-is-not-in-the-keyring'
    const createdIDs: Array<{ collection: string; id: number | string }> = []

    const deriveKey = (secret: string) =>
      crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)

    const indexFor = (secret: string, rawApiKey: string) =>
      crypto.createHmac('sha256', deriveKey(secret)).update(rawApiKey).digest('hex')

    const hashOf = (rawApiKey: string) =>
      crypto.createHash('sha256').update(rawApiKey).digest('hex')

    // Produces a pre-v1 aes-256-ctr ciphertext (the format used before the v1
    // envelope), which decrypts to garbage rather than throwing under a wrong key.
    const legacyCtrEncrypt = (value: string, secret: string) => {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv('aes-256-ctr', deriveKey(secret), iv)
      return iv.toString('hex') + cipher.update(value, 'utf8', 'hex') + cipher.final('hex')
    }

    /**
     * Writes an encrypted apiKey plus its HMAC index straight to the database, bypassing
     * the field hooks, to reproduce a row written before keys were stored as hashes.
     */
    const seedPreHashUser = async (
      {
        apiKey,
        collection = rotateSecretSlug,
        data = {},
        index,
        rawApiKey,
      }: {
        apiKey?: string
        collection?: string
        data?: Record<string, unknown>
        index?: null | string
        rawApiKey: string
      },
      { payload }: { payload: Payload },
    ) => {
      const user = await payload.create({
        collection,
        data: { apiKey: rawApiKey, enableAPIKey: true, ...data },
      })
      createdIDs.push({ id: user.id, collection })

      await payload.db.updateOne({
        id: user.id,
        collection,
        data: {
          apiKey: apiKey ?? payload.encrypt(rawApiKey, { secret: OLD_SECRET }),
          apiKeyIndex: index === undefined ? indexFor(OLD_SECRET, rawApiKey) : index,
        },
        returning: false,
      })

      return user
    }

    const readRawRow = async ({
      id,
      collection,
      payload,
    }: {
      collection: string
      id: number | string
      payload: Payload
    }) =>
      await payload.db.findOne<any>({
        collection,
        where: { id: { equals: id } },
      })

    const authenticates = async ({
      id,
      collection,
      rawApiKey,
      restClient,
    }: {
      collection: string
      id: number | string
      rawApiKey: string
      restClient: NextRESTClient
    }) => {
      const response = await restClient.GET(`/${collection}/${id}`, {
        headers: { Authorization: `${collection} API-Key ${rawApiKey}` },
      })

      return response.status === 200
    }

    test.afterEach(async ({ payload }) => {
      const idsByCollection = new Map<string, Array<number | string>>()
      for (const { id, collection } of createdIDs) {
        idsByCollection.set(collection, [...(idsByCollection.get(collection) ?? []), id])
      }
      for (const [collection, ids] of idsByCollection) {
        await payload.delete({ collection, where: { id: { in: ids } } })
      }
      createdIDs.length = 0
    })

    test('should convert a row encrypted under the current secret', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey),
          index: indexFor(payload.config.secret, rawApiKey),
          rawApiKey,
        },
        { payload },
      )

      const result = await migrateAPIKeysToHash({
        collections: [rotateSecretSlug],
        payload,
      })

      expect(result).toEqual({ failed: 0, migrated: 1, skipped: 0 })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })

      expect(raw.apiKey).toBe(hashOf(rawApiKey))
      expect(raw.apiKeyIndex).toBeFalsy()
    })

    test('should make a pre-hash key authenticate again', async ({ payload, restClient }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser({ rawApiKey }, { payload })

      // Before the migration the key cannot authenticate: the auth strategy matches a
      // one-way hash, and this row still holds ciphertext.
      expect(
        await authenticates({
          id: user.id,
          collection: rotateSecretSlug,
          rawApiKey,
          restClient,
        }),
      ).toBe(false)

      await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(
        await authenticates({
          id: user.id,
          collection: rotateSecretSlug,
          rawApiKey,
          restClient,
        }),
      ).toBe(true)
    })

    test('should not reactivate a disabled pre-hash key', async ({ payload, restClient }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey, { secret: OLD_SECRET }),
          data: { enableAPIKey: false },
          index: null,
          rawApiKey,
        },
        { payload },
      )

      expect(
        await authenticates({
          id: user.id,
          collection: rotateSecretSlug,
          rawApiKey,
          restClient,
        }),
      ).toBe(false)

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result).toEqual({ failed: 0, migrated: 0, skipped: 1 })
      expect(
        await authenticates({
          id: user.id,
          collection: rotateSecretSlug,
          rawApiKey,
          restClient,
        }),
      ).toBe(false)

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(raw.apiKey).toBeFalsy()
      expect(raw.apiKeyIndex).toBeFalsy()
    })

    test('should convert a row encrypted under a previous secret', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser({ rawApiKey }, { payload })

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result.migrated).toBe(1)

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))
    })

    test('should convert a legacy aes-256-ctr row', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        { apiKey: legacyCtrEncrypt(rawApiKey, OLD_SECRET), rawApiKey },
        { payload },
      )

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result.migrated).toBe(1)

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))
    })

    test('should reject a legacy aes-256-ctr row without its lookup index', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: legacyCtrEncrypt(rawApiKey, OLD_SECRET),
          index: null,
          rawApiKey,
        },
        { payload },
      )

      const before = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })
      const after = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })

      expect(result).toEqual({ failed: 1, migrated: 0, skipped: 0 })
      expect(after.apiKey).toBe(before.apiKey)
      expect(after.apiKeyIndex).toBeFalsy()
    })

    test('should convert an authenticated v1 row without its lookup index', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey, { secret: OLD_SECRET }),
          index: null,
          rawApiKey,
        },
        { payload },
      )

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })
      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })

      expect(result).toEqual({ failed: 0, migrated: 1, skipped: 0 })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))
      expect(raw.apiKeyIndex).toBeFalsy()
    })

    test('should clear a legacy lookup index when a key is replaced', async ({ payload }) => {
      const originalAPIKey = uuid()
      const replacementAPIKey = uuid()
      const user = await seedPreHashUser({ rawApiKey: originalAPIKey }, { payload })

      await payload.update({
        id: user.id,
        collection: rotateSecretSlug,
        data: { apiKey: replacementAPIKey },
      })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(raw.apiKey).toBe(hashOf(replacementAPIKey))
      expect(raw.apiKeyIndex).toBeFalsy()
      expect(result).toEqual({ failed: 0, migrated: 0, skipped: 1 })
    })

    test('should convert a row whose secret is passed explicitly', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey, { secret: UNKNOWN_SECRET }),
          index: indexFor(UNKNOWN_SECRET, rawApiKey),
          rawApiKey,
        },
        { payload },
      )

      const withoutSecret = await migrateAPIKeysToHash({
        collections: [rotateSecretSlug],
        payload,
      })
      expect(withoutSecret).toEqual({ failed: 1, migrated: 0, skipped: 0 })

      const withSecret = await migrateAPIKeysToHash({
        collections: [rotateSecretSlug],
        payload,
        secrets: [UNKNOWN_SECRET],
      })
      expect(withSecret).toEqual({ failed: 0, migrated: 1, skipped: 0 })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))
    })

    test('should leave an unverifiable row untouched and report it', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey, { secret: UNKNOWN_SECRET }),
          index: 'this-index-matches-no-secret',
          rawApiKey,
        },
        { payload },
      )

      const before = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result).toEqual({ failed: 1, migrated: 0, skipped: 0 })

      const after = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(after.apiKey).toBe(before.apiKey)
      expect(after.apiKeyIndex).toBe(before.apiKeyIndex)
    })

    test('should be safe to re-run', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser({ rawApiKey }, { payload })

      await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })
      const rerun = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(rerun).toEqual({ failed: 0, migrated: 0, skipped: 1 })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))
    })

    test('should leave a row it has already converted alone', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await payload.create({
        collection: rotateSecretSlug,
        data: { apiKey: rawApiKey, enableAPIKey: true },
      })
      createdIDs.push({ id: user.id, collection: rotateSecretSlug })

      const before = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(before.apiKey).toBe(hashOf(rawApiKey))

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result).toEqual({ failed: 0, migrated: 0, skipped: 1 })

      const after = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(after.apiKey).toBe(before.apiKey)
    })

    test('should not write anything during a dry run', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser({ rawApiKey }, { payload })

      const result = await migrateAPIKeysToHash({
        collections: [rotateSecretSlug],
        dryRun: true,
        payload,
      })

      expect(result).toEqual({ failed: 0, migrated: 1, skipped: 0 })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretSlug, payload })
      expect(payload.decrypt(raw.apiKey, { secret: OLD_SECRET })).toBe(rawApiKey)
      expect(raw.apiKeyIndex).toBe(indexFor(OLD_SECRET, rawApiKey))
    })

    test('should ignore documents without a key', async ({ payload }) => {
      const user = await payload.create({
        collection: rotateSecretSlug,
        data: { enableAPIKey: false },
      })
      createdIDs.push({ id: user.id, collection: rotateSecretSlug })

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result).toEqual({ failed: 0, migrated: 0, skipped: 0 })
    })

    test('should only process the collections it is given', async ({ payload }) => {
      const firstKey = uuid()
      const secondKey = uuid()

      await seedPreHashUser({ rawApiKey: firstKey }, { payload })
      const untouched = await seedPreHashUser(
        { collection: rotateSecretSecondarySlug, rawApiKey: secondKey },
        { payload },
      )

      const result = await migrateAPIKeysToHash({ collections: [rotateSecretSlug], payload })

      expect(result.migrated).toBe(1)

      const raw = await readRawRow({
        id: untouched.id,
        collection: rotateSecretSecondarySlug,
        payload,
      })
      expect(raw.apiKey.startsWith('v1:')).toBe(true)
    })

    test('should not return a pre-hash value on read', async ({ payload }) => {
      const rawApiKey = uuid()
      const user = await seedPreHashUser({ rawApiKey }, { payload })

      const doc = await payload.findByID({ id: user.id, collection: rotateSecretSlug })

      expect(doc.apiKey).toStrictEqual('')
    })

    test('should convert keys when called through rotateSecret', async ({ payload }) => {
      const rawApiKey = uuid()
      const loginEmail = 'rotate-login@example.com'
      const loginPassword = 'Password123'

      const user = await seedPreHashUser(
        {
          collection: rotateSecretLoginSlug,
          data: { email: loginEmail, password: loginPassword },
          rawApiKey,
        },
        { payload },
      )

      const result = await rotateSecret({
        collections: [rotateSecretLoginSlug],
        payload,
      })

      expect(result).toEqual({ migrated: 1, skipped: 0 })

      const raw = await readRawRow({ id: user.id, collection: rotateSecretLoginSlug, payload })
      expect(raw.apiKey).toBe(hashOf(rawApiKey))

      // Password logins are untouched by any of this - the salt and hash never
      // involved the secret.
      const { token } = await payload.login({
        collection: rotateSecretLoginSlug,
        data: { email: loginEmail, password: loginPassword },
      })
      expect(token).toBeDefined()
    })

    test('should throw from rotateSecret when a row cannot be verified', async ({ payload }) => {
      const rawApiKey = uuid()
      await seedPreHashUser(
        {
          apiKey: payload.encrypt(rawApiKey, { secret: UNKNOWN_SECRET }),
          index: 'this-index-matches-no-secret',
          rawApiKey,
        },
        { payload },
      )

      await expect(
        rotateSecret({
          collections: [rotateSecretSlug],
          oldSecret: OLD_SECRET,
          payload,
        }),
      ).rejects.toThrow(/could not be verified/)
    })

    test('reencrypt should re-key a value to the active secret', ({ payload }) => {
      const rawValue = 'super-sensitive-value'
      const oldCiphertext = payload.encrypt(rawValue, { secret: OLD_SECRET })

      const rekeyed = payload.reencrypt(oldCiphertext, { oldSecret: OLD_SECRET })

      expect(payload.decrypt(rekeyed)).toBe(rawValue)

      // The rekeyed value carries the active key id, not the previous secret's.
      const oldKeyId = oldCiphertext.split(':')[1]
      const newKeyId = rekeyed.split(':')[1]
      expect(newKeyId).not.toBe(oldKeyId)
      expect(newKeyId).toBe(payload.encryptionKeyring.active.keyId)
    })
  })

  test.describe('encryption envelope (v1) and keyring', () => {
    const legacyCtrEncrypt = (value: string, secret: string) => {
      const key = crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
      return iv.toString('hex') + cipher.update(value, 'utf8', 'hex') + cipher.final('hex')
    }

    test('should encrypt with the v1 aes-256-gcm envelope and round-trip', ({ payload }) => {
      const encrypted = payload.encrypt('secret-value')

      expect(encrypted.startsWith('v1:')).toBe(true)
      expect(encrypted.split(':')[1]).toBe(payload.encryptionKeyring.active.keyId)
      expect(payload.decrypt(encrypted)).toBe('secret-value')
    })

    test('should still decrypt legacy aes-256-ctr values', ({ payload }) => {
      const legacy = legacyCtrEncrypt('legacy-value', payload.config.secret)

      expect(legacy.startsWith('v1:')).toBe(false)
      expect(payload.decrypt(legacy)).toBe('legacy-value')
    })

    test('should throw when a v1 value has been tampered with', ({ payload }) => {
      const encrypted = payload.encrypt('tamper-me')
      const lastChar = encrypted.slice(-1)
      const tampered = encrypted.slice(0, -1) + (lastChar === 'a' ? 'b' : 'a')

      expect(() => payload.decrypt(tampered)).toThrow()
    })

    test('should throw when no keyring secret matches the value key id', ({ payload }) => {
      const encrypted = payload.encrypt('x', { secret: 'a-secret-not-in-the-keyring' })

      expect(() => payload.decrypt(encrypted)).toThrow(/no secret in the keyring/)
    })

    // Hand-signs an HS256 JWT (jose verifies with the utf8 bytes of the derived
    // key), re-using a real login's claims so session validation still passes.
    const signHS256 = (claims: Record<string, unknown>, secret: string) => {
      const key = crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)
      const b64 = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url')
      const data = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}`
      const signature = crypto.createHmac('sha256', key).update(data).digest('base64url')
      return `${data}.${signature}`
    }

    test('should verify a JWT signed under a previous secret, and reject an unknown secret', async ({
      payload,
      restClient,
    }) => {
      const { token, user } = await payload.login({ collection: slug, data: { email, password } })

      const { exp: _exp, iat: _iat, ...claims } = jwtDecode<Record<string, unknown>>(token)
      const nowInSeconds = Math.floor(Date.now() / 1000)
      const freshClaims = { ...claims, exp: nowInSeconds + 3600, iat: nowInSeconds }

      // Signed under a previousSecret (in the keyring) - still authenticates.
      const underPrevious = await restClient
        .GET('/users/me', {
          headers: { Authorization: `JWT ${signHS256(freshClaims, rotateSecretOldSecret)}` },
        })
        .then((res) => res.json())
      expect(underPrevious.user?.id).toBe(user?.id)

      // Signed under a secret not in the keyring - rejected.
      const underUnknown = await restClient
        .GET('/users/me', {
          headers: {
            Authorization: `JWT ${signHS256(freshClaims, 'a-secret-not-in-the-keyring')}`,
          },
        })
        .then((res) => res.json())
      expect(underUnknown.user).toBeFalsy()
    })
  })
})
