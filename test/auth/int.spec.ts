import type { DrizzleAdapter } from '@payloadcms/drizzle'
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
import path from 'path'
import { createLocalReq, Forbidden, getFieldsToSign, traverseFields } from 'payload'
import { email as emailValidation } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vitest } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { ApiKey } from './payload-types.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { transformForWrite } from '../../packages/drizzle/src/transform/write/index.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  apiKeysSlug,
  namedSaveToJWTValue,
  partialDisableLocalStrategiesSlug,
  preferencesSlug,
  publicUsersSlug,
  saveToJWTKey,
  slug,
} from './shared.js'

let restClient: NextRESTClient
let payload: Payload

const { email, password } = devUser

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Auth', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('Preference updates', () => {
    const key = 'display-settings'
    const createdUserIDs: (number | string)[] = []
    const createdPreferenceIDs: (number | string)[] = []
    let owner: User
    let otherUser: User
    let ownerPreferenceID: number | string
    let otherPreferenceID: number | string
    let ownerToken: string

    beforeAll(async () => {
      const firstUser = await payload.create({
        collection: slug,
        data: { email: 'preferences-owner@example.com', password },
      })
      createdUserIDs.push(firstUser.id)
      owner = { ...firstUser, collection: slug }

      const secondUser = await payload.create({
        collection: slug,
        data: { email: 'preferences-other@example.com', password },
      })
      createdUserIDs.push(secondUser.id)
      otherUser = { ...secondUser, collection: slug }

      const login = await payload.login({
        collection: slug,
        data: { email: firstUser.email, password },
      })
      ownerToken = login.token!
    })

    beforeEach(async () => {
      for (const user of [owner, otherUser]) {
        const preference = await payload.create({
          collection: preferencesSlug,
          data: { key, value: { theme: 'light' } },
          user,
        })
        createdPreferenceIDs.push(preference.id)
      }
      ;[ownerPreferenceID, otherPreferenceID] = createdPreferenceIDs
    })

    afterEach(async () => {
      for (const id of createdPreferenceIDs) {
        await payload.delete({ collection: preferencesSlug, id })
      }
      createdPreferenceIDs.length = 0
    })

    afterAll(async () => {
      for (const id of createdUserIDs) {
        await payload.delete({ collection: slug, id })
      }
    })

    it('should update an owned preference by ID', async () => {
      const response = await restClient.PATCH(`/${preferencesSlug}/${ownerPreferenceID}`, {
        body: JSON.stringify({ value: { theme: 'dark' } }),
        headers: { Authorization: `JWT ${ownerToken}` },
      })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.doc.id).toBe(ownerPreferenceID)
      expect(result.doc.value).toEqual({ theme: 'dark' })
    })

    it('should not update or return another user preference by ID', async () => {
      const response = await restClient.PATCH(`/${preferencesSlug}/${otherPreferenceID}`, {
        body: JSON.stringify({ value: { theme: 'dark' } }),
        headers: { Authorization: `JWT ${ownerToken}` },
      })
      const result = await response.json()
      const unchanged = await payload.findByID({
        collection: preferencesSlug,
        depth: 0,
        id: otherPreferenceID,
      })

      expect(response.status).toBe(403)
      expect(result.doc).toBeUndefined()
      expect(unchanged.value).toEqual({ theme: 'light' })
      expect(unchanged.user).toEqual({ relationTo: slug, value: otherUser.id })
    })

    it('should only update and return owned preferences in a bulk update', async () => {
      const response = await restClient.PATCH(`/${preferencesSlug}`, {
        body: JSON.stringify({ value: { theme: 'dark' } }),
        headers: { Authorization: `JWT ${ownerToken}` },
        query: { where: { key: { equals: key } } },
      })
      const result = await response.json()
      const unchanged = await payload.findByID({
        collection: preferencesSlug,
        depth: 0,
        id: otherPreferenceID,
      })

      expect(response.status).toBe(200)
      expect(result.errors).toEqual([])
      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].id).toBe(ownerPreferenceID)
      expect(result.docs[0].value).toEqual({ theme: 'dark' })
      expect(unchanged.value).toEqual({ theme: 'light' })
      expect(unchanged.user).toEqual({ relationTo: slug, value: otherUser.id })
    })
  })

  describe('GraphQL - admin user', () => {
    let token
    let user
    beforeAll(async () => {
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

    it('should login', () => {
      expect(user.id).toBeDefined()
      expect(user.email).toEqual(devUser.email)
      expect(token).toBeDefined()
    })

    it('should have fields saved to JWT', () => {
      const decoded = jwtDecode<User>(token)
      const { collection, email: jwtEmail, exp, iat, roles } = decoded

      expect(jwtEmail).toBeDefined()
      expect(collection).toEqual('users')
      expect(Array.isArray(roles)).toBeTruthy()
      expect(iat).toBeDefined()
      expect(exp).toBeDefined()
    })
  })

  describe('REST - admin user', () => {
    describe('password hashes', () => {
      const createdUserIDs: Array<number | string> = []

      afterEach(async () => {
        for (const id of createdUserIDs) {
          await payload.delete({ collection: slug, id })
        }
        createdUserIDs.length = 0
      })

      it('should update an existing password hash after login', async () => {
        const testEmail = 'existing-password-hash@example.com'
        const testPassword = 'test-password'
        const existingSalt = crypto.randomBytes(32).toString('hex')
        const existingHash = crypto
          .pbkdf2Sync(testPassword, existingSalt, 25000, 512, 'sha256')
          .toString('hex')
        const user = await payload.create({
          collection: slug,
          data: {
            email: testEmail,
            password: testPassword,
          },
        })
        createdUserIDs.push(user.id)

        await payload.db.updateOne({
          collection: slug,
          data: {
            hash: existingHash,
            salt: existingSalt,
          },
          id: user.id,
        })

        await payload.login({
          collection: slug,
          data: {
            email: testEmail,
            password: testPassword,
          },
        })

        const updatedUser = await payload.db.findOne({
          collection: slug,
          select: {
            hash: true,
            salt: true,
          },
          where: {
            id: { equals: user.id },
          },
        })

        expect(updatedUser?.hash).not.toBe(existingHash)
        expect(updatedUser?.hash).toMatch(/^pbkdf2-sha256-v1:[a-f0-9]{64}$/)
        expect(updatedUser?.salt).not.toBe(existingSalt)
      })

      it('should preserve a password changed during login', async () => {
        const testEmail = 'password-change-during-login@example.com'
        const testPassword = 'test-password'
        const changedPassword = 'changed-password'
        const existingSalt = crypto.randomBytes(32).toString('hex')
        const existingHash = crypto
          .pbkdf2Sync(testPassword, existingSalt, 25000, 512, 'sha256')
          .toString('hex')
        const changedSalt = crypto.randomBytes(32).toString('hex')
        const changedHash = `pbkdf2-sha256-v1:${crypto
          .pbkdf2Sync(changedPassword, changedSalt, 600000, 32, 'sha256')
          .toString('hex')}`
        const user = await payload.create({
          collection: slug,
          data: {
            email: testEmail,
            password: testPassword,
          },
        })
        createdUserIDs.push(user.id)

        await payload.db.updateOne({
          collection: slug,
          data: {
            hash: existingHash,
            salt: existingSalt,
          },
          id: user.id,
        })

        const collectionConfig = payload.config.collections.find(
          ({ slug: collectionSlug }) => collectionSlug === slug,
        )!
        const maxLoginAttempts = collectionConfig.auth.maxLoginAttempts
        const originalUpdateOne = payload.db.updateOne
        let shouldChangePassword = true

        collectionConfig.auth.maxLoginAttempts = 0
        payload.db.updateOne = async (args) => {
          if (
            shouldChangePassword &&
            args.collection === slug &&
            typeof args.data.hash === 'string' &&
            args.data.hash.startsWith('pbkdf2-sha256-v1:')
          ) {
            shouldChangePassword = false
            // Shares the login transaction so this write is not blocked by its row lock
            await originalUpdateOne.call(payload.db, {
              collection: slug,
              data: {
                hash: changedHash,
                salt: changedSalt,
              },
              id: user.id,
              req: args.req,
            })
          }

          return originalUpdateOne.call(payload.db, args)
        }

        try {
          await payload.login({
            collection: slug,
            data: {
              email: testEmail,
              password: testPassword,
            },
          })
        } finally {
          payload.db.updateOne = originalUpdateOne
          collectionConfig.auth.maxLoginAttempts = maxLoginAttempts
        }

        const updatedUser = await payload.db.findOne({
          collection: slug,
          select: {
            hash: true,
            salt: true,
          },
          where: {
            id: { equals: user.id },
          },
        })

        expect(updatedUser?.hash).toBe(changedHash)
        expect(updatedUser?.salt).toBe(changedSalt)
      })

      it.runIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
        'should preserve a password changed after updating an existing hash',
        async () => {
          const testEmail = 'password-change-after-hash-update@example.com'
          const testPassword = 'test-password'
          const changedPassword = 'changed-password'
          const existingSalt = crypto.randomBytes(32).toString('hex')
          const existingHash = crypto
            .pbkdf2Sync(testPassword, existingSalt, 25000, 512, 'sha256')
            .toString('hex')
          const changedSalt = crypto.randomBytes(32).toString('hex')
          const changedHash = `pbkdf2-sha256-v1:${crypto
            .pbkdf2Sync(changedPassword, changedSalt, 600000, 32, 'sha256')
            .toString('hex')}`
          const user = await payload.create({
            collection: slug,
            data: {
              email: testEmail,
              password: testPassword,
            },
          })
          createdUserIDs.push(user.id)

          await payload.db.updateOne({
            collection: slug,
            data: {
              hash: existingHash,
              salt: existingSalt,
            },
            id: user.id,
          })

          const originalUpdateOne = payload.db.updateOne
          let shouldChangePassword = true

          payload.db.updateOne = async (args) => {
            const updatedDoc = await originalUpdateOne.call(payload.db, args)

            if (
              shouldChangePassword &&
              args.collection === slug &&
              typeof args.data.hash === 'string' &&
              args.data.hash.startsWith('pbkdf2-sha256-v1:') &&
              'where' in args
            ) {
              shouldChangePassword = false
              await originalUpdateOne.call(payload.db, {
                collection: slug,
                data: {
                  hash: changedHash,
                  salt: changedSalt,
                },
                id: user.id,
              })
            }

            return updatedDoc
          }

          try {
            await payload.login({
              collection: slug,
              data: {
                email: testEmail,
                password: testPassword,
              },
            })
          } finally {
            payload.db.updateOne = originalUpdateOne
          }

          const updatedUser = await payload.db.findOne({
            collection: slug,
            select: {
              hash: true,
              salt: true,
            },
            where: {
              id: { equals: user.id },
            },
          })

          expect(updatedUser?.hash).toBe(changedHash)
          expect(updatedUser?.salt).toBe(changedSalt)
        },
      )

      it('should update an existing password hash when the password is shorter than required', async () => {
        const testEmail = 'short-existing-password@example.com'
        const testPassword = 'a'
        const existingSalt = crypto.randomBytes(32).toString('hex')
        const existingHash = crypto
          .pbkdf2Sync(testPassword, existingSalt, 25000, 512, 'sha256')
          .toString('hex')
        const user = await payload.create({
          collection: slug,
          data: {
            email: testEmail,
            password: 'test-password',
          },
        })
        createdUserIDs.push(user.id)

        await payload.db.updateOne({
          collection: slug,
          data: {
            hash: existingHash,
            salt: existingSalt,
          },
          id: user.id,
        })

        await payload.login({
          collection: slug,
          data: {
            email: testEmail,
            password: testPassword,
          },
        })

        const updatedUser = await payload.db.findOne({
          collection: slug,
          select: {
            hash: true,
            salt: true,
          },
          where: {
            id: { equals: user.id },
          },
        })

        expect(updatedUser?.hash).toMatch(/^pbkdf2-sha256-v1:[a-f0-9]{64}$/)
        expect(updatedUser?.salt).not.toBe(existingSalt)
      })
    })

    it('should prevent registering a new first user', async () => {
      const response = await restClient.POST(`/${slug}/first-register`, {
        body: JSON.stringify({
          'confirm-password': password,
          email,
          password,
        }),
      })

      expect(response.status).toBe(403)
    })

    it('should handle constrained session updates', async () => {
      const marker = 'constrainedSessionUpdate'
      const inheritedMarker = 'constrainedInheritedSessionUpdate'
      const protoMarker = 'constrainedProtoUpdate'
      const constructorMarker = 'constrainedConstructorUpdate'
      const prototypeMarker = 'constrainedPrototypeUpdate'
      const inheritedTarget = Object.prototype.toString as unknown as Record<string, unknown>
      const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, marker)
      const originalInheritedDescriptor = Object.getOwnPropertyDescriptor(
        inheritedTarget,
        inheritedMarker,
      )
      const createConstrainedData = (): Record<string, unknown> =>
        JSON.parse(`{
          "__proto__": {},
          "constructor": {},
          "prototype": {},
          "__proto__.${protoMarker}": "local",
          "constructor.${constructorMarker}": "local",
          "prototype.${prototypeMarker}": "local",
          "toString.${inheritedMarker}": "local"
        }`) as Record<string, unknown>
      const sharedData = createConstrainedData()
      const drizzleData = createConstrainedData()
      const sharedProtoTarget = sharedData['__proto__'] as Record<string, unknown>
      const sharedConstructorTarget = sharedData['constructor'] as Record<string, unknown>
      const sharedPrototypeTarget = sharedData['prototype'] as Record<string, unknown>
      const drizzleProtoTarget = drizzleData['__proto__'] as Record<string, unknown>
      const drizzleConstructorTarget = drizzleData['constructor'] as Record<string, unknown>
      const drizzlePrototypeTarget = drizzleData['prototype'] as Record<string, unknown>
      let testError: Error | undefined

      try {
        traverseFields({ fields: [], fillEmpty: false, ref: sharedData })
        transformForWrite({
          adapter: payload.db as DrizzleAdapter,
          data: drizzleData,
          fields: [],
          tableName: 'session_users',
        })

        const response = await restClient.POST('/session-users/first-register', {
          body: JSON.stringify({
            email: 'session-user@example.com',
            password: 'test-password',
            sessions: {
              $push: [
                { [`__proto__.${marker}`]: 'local' },
                { [`__proto__.${marker}`]: 'local' },
                { [`__proto__.${marker}`]: 'local' },
                { [`toString.${inheritedMarker}`]: 'local' },
              ],
            },
          }),
        })
        const { totalDocs } = await payload.count({ collection: 'session-users' })

        expect(response.status).toBe(400)
        expect(totalDocs).toBe(0)
        expect(sharedProtoTarget).not.toHaveProperty(protoMarker)
        expect(sharedConstructorTarget).toHaveProperty(constructorMarker, 'local')
        expect(sharedPrototypeTarget).toHaveProperty(prototypeMarker, 'local')
        expect(drizzleProtoTarget).not.toHaveProperty(protoMarker)
        expect(drizzleConstructorTarget).toHaveProperty(constructorMarker, 'local')
        expect(drizzlePrototypeTarget).toHaveProperty(prototypeMarker, 'local')
        expect(Object.hasOwn(sharedData, 'toString')).toBe(true)
        expect(sharedData['toString']).toHaveProperty(inheritedMarker, 'local')
        expect(Object.hasOwn(drizzleData, 'toString')).toBe(true)
        expect(drizzleData['toString']).toHaveProperty(inheritedMarker, 'local')
        expect(Object.prototype).not.toHaveProperty(marker)
        expect(inheritedTarget).not.toHaveProperty(inheritedMarker)
      } catch (error) {
        testError = error instanceof Error ? error : new Error(String(error))
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(Object.prototype, marker, originalDescriptor)
        } else {
          delete (Object.prototype as Record<string, unknown>)[marker]
        }
        if (originalInheritedDescriptor) {
          Object.defineProperty(inheritedTarget, inheritedMarker, originalInheritedDescriptor)
        } else {
          delete inheritedTarget[inheritedMarker]
        }
      }

      expect(Object.getOwnPropertyDescriptor(Object.prototype, marker)).toEqual(originalDescriptor)
      expect(Object.getOwnPropertyDescriptor(inheritedTarget, inheritedMarker)).toEqual(
        originalInheritedDescriptor,
      )

      if (testError) {
        throw testError
      }
    })

    it('should login a user successfully', async () => {
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

    it('should return a user with read access from the login operation', async () => {
      const testEmail = `login-field-access-${uuid()}@example.com`
      const user = await payload.create({
        collection: slug,
        data: {
          email: testEmail,
          password,
          restrictedField: 'restricted value',
          roles: ['editor'],
        } as any,
      })

      try {
        const response = await restClient.POST(`/${slug}/login`, {
          body: JSON.stringify({ email: testEmail, password }),
        })
        const authenticated = await response.json()

        expect(response.status).toBe(200)
        expect(authenticated.user.id).toBe(user.id)
        expect(authenticated.user).not.toHaveProperty('restrictedField')
      } finally {
        await payload.delete({ id: user.id, collection: slug })
      }
    })

    it('should not lose data if login throws', async () => {
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

    describe('logged in', () => {
      let token: string | undefined
      let loggedInUser: undefined | User

      beforeAll(async () => {
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

      it('should allow a user to change password without returning password', async () => {
        const result = await payload.update({
          id: loggedInUser.id,
          collection: slug,
          data: {
            password: 'test',
          },
        })

        expect(result.id).toStrictEqual(loggedInUser.id)
        expect(result.password).toBeUndefined()

        const reLogin = await restClient.POST(`/${slug}/login`, {
          body: JSON.stringify({
            email,
            password: 'test',
          }),
        })
        const reLoginData = await reLogin.json()
        token = reLoginData.token
        loggedInUser = reLoginData.user
      })

      it('should return a logged in user from /me', async () => {
        const response = await restClient.GET(`/${slug}/me`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(data.strategy).toBeDefined()
        expect(typeof data.exp).toBe('number')
        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
      })

      it('should have fields saved to JWT', () => {
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

      it('should not crash when building JWT for user with missing group/tab fields', () => {
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

      it('should allow authentication with an API key with useAPIKey', async () => {
        const apiKey = '0123456789ABCDEFGH'

        const user = await payload.create({
          collection: slug,
          data: {
            apiKey,
            email: 'dev@example.com',
            password: 'test',
          },
        })

        const response = await restClient.GET(`/${slug}/me`, {
          headers: {
            Authorization: `${slug} API-Key ${user?.apiKey}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
        expect(data.user.apiKey).toStrictEqual(apiKey)
      })

      it('should refresh a token and reset its expiration', async () => {
        const response = await restClient.POST(`/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.refreshedToken).toBeDefined()
      })

      describe('refresh collection identity', () => {
        const alternateUserIDs: (number | string)[] = []

        beforeAll(async () => {
          payload.db.allowIDOnCreate = true
          payload.config.db.allowIDOnCreate = true

          const alternateUser = await payload.create({
            collection: publicUsersSlug,
            data: {
              id: loggedInUser!.id,
              email: 'refresh-collection@example.com',
              password,
            },
          })

          alternateUserIDs.push(alternateUser.id)
        })

        afterAll(async () => {
          for (const id of alternateUserIDs) {
            await payload.delete({
              id,
              collection: publicUsersSlug,
            })
          }

          payload.db.allowIDOnCreate = false
          payload.config.db.allowIDOnCreate = false
        })

        it('should create the alternate user with the same ID as the logged-in user', () => {
          expect(alternateUserIDs[0]).toStrictEqual(loggedInUser!.id)
        })

        it('should not refresh through a different auth collection via REST', async () => {
          const response = await restClient.POST(`/${publicUsersSlug}/refresh-token`, {
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          expect(response.status).toBe(403)
        })

        it('should not refresh through a different auth collection via GraphQL', async () => {
          const response = await restClient.GRAPHQL_POST({
            body: JSON.stringify({
              query: `mutation {
                refreshTokenPublicUser {
                  refreshedToken
                }
              }`,
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          const result = await response.json()

          expect(result.data.refreshTokenPublicUser).toBeNull()
          expect(result.errors[0].extensions.statusCode).toBe(403)
        })

        it('should refresh through the authenticated collection via GraphQL', async () => {
          const response = await restClient.GRAPHQL_POST({
            body: JSON.stringify({
              query: `mutation {
                refreshTokenUser {
                  refreshedToken
                }
              }`,
            }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })

          const result = await response.json()

          expect(result.errors).toBeUndefined()
          expect(result.data.refreshTokenUser.refreshedToken).toBeDefined()
        })
      })

      it('should refresh a token and receive an up-to-date user', async () => {
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

      it('keeps apiKey encrypted in DB after refresh operation', async () => {
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
        expect(raw?.apiKey).not.toContain('-') // still ciphertext
      })

      it('returns a user with decrypted apiKey after refresh', async () => {
        const { token } = await payload.login({
          collection: 'users',
          data: { email: 'user@example.com', password: 'Password123' },
        })

        const res = await restClient
          .POST('/users/refresh-token', {
            headers: { Authorization: `JWT ${token}` },
          })
          .then((r) => r.json())

        expect(res.user.apiKey).toMatch(/[0-9a-f-]{36}/) // UUID string
      })

      it('should allow a user to be created', async () => {
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

      it('should allow verification of a user', async () => {
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

      describe('User Preferences', () => {
        const key = 'test'
        const property = 'store'
        let data

        beforeAll(async () => {
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

        it('should create', () => {
          expect(data.doc.key).toStrictEqual(key)
          expect(data.doc.value.property).toStrictEqual(property)
        })

        it('should read', async () => {
          const response = await restClient.GET(`/payload-preferences/${key}`, {
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          data = await response.json()
          expect(data.key).toStrictEqual(key)
          expect(data.value.property).toStrictEqual(property)
        })

        it('should update', async () => {
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

        it('should only have one preference per user per key', async () => {
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

        it('should delete', async () => {
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

      describe('Cross-Collection Preference Isolation', () => {
        const adminKey = 'cross-collection-admin'
        const publicKey = 'cross-collection-public'
        let publicUserToken: string
        let publicUserId: number | string
        const createdIDs: (number | string)[] = []

        beforeAll(async () => {
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
            id: publicUserId,
            collection: publicUsersSlug,
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

        afterAll(async () => {
          await Promise.all(
            createdIDs.map((id) =>
              payload.delete({ id, collection: 'payload-preferences' }).catch(() => {}),
            ),
          )
          if (publicUserId) {
            await payload.delete({ id: publicUserId, collection: publicUsersSlug }).catch(() => {})
          }
        })

        it('should only return own preferences via REST find', async () => {
          const res = await restClient.GET('/payload-preferences', {
            headers: { Authorization: `JWT ${publicUserToken}` },
          })
          const data: any = await res.json()

          expect(data.docs).toHaveLength(1)
          expect(data.docs[0].user.relationTo).toBe(publicUsersSlug)
          expect(data.docs.some((doc: any) => doc.user.relationTo === 'users')).toBe(false)
        })

        it('should not delete other collection preferences via REST', async () => {
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

        it('should isolate preferences by user ID and collection', async () => {
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

      describe('Account Locking', () => {
        const userEmail = 'lock@me.com'

        const tryLogin = async (success?: boolean) => {
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

        beforeAll(async () => {
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

        beforeEach(async () => {
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

        it('should lock the user after too many attempts', async () => {
          const user1 = await tryLogin()
          const user2 = await tryLogin()
          const user3 = await tryLogin() // Let it call multiple times, therefore the unlock condition has no bug.

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

          const successfulLogin = await tryLogin(true)
          expect(successfulLogin.errors?.[0].message).toBe(
            'This user is locked due to having too many failed login attempts.',
          )
        })

        it('should lock the user after too many parallel attempts', async () => {
          const tryLoginAttempts = 100
          const users = await Promise.allSettled(
            Array.from({ length: tryLoginAttempts }, () => tryLogin()),
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

          const successfulLogin = await tryLogin(true)

          expect(successfulLogin.errors?.[0].message).toBe(
            'This user is locked due to having too many failed login attempts.',
          )
        })

        it('ensure that login session expires if max login attempts is reached within narrow time-frame', async () => {
          const tryLoginAttempts = 5

          // If there are 100 parallel login attempts, 99 incorrect and 1 correct one, we do not want the correct one to be able to consistently be able
          // to login successfully.
          const user = await tryLogin(true)
          const firstMeResponse = await restClient.GET(`/${slug}/me`, {
            headers: {
              Authorization: `JWT ${user.token}`,
            },
          })

          expect(firstMeResponse.status).toBe(200)

          const firstMeData = await firstMeResponse.json()

          expect(firstMeData.token).toBeDefined()
          expect(firstMeData.user.email).toBeDefined()

          await Promise.allSettled(Array.from({ length: tryLoginAttempts }, () => tryLogin()))

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

        it('should unlock account once lockUntil period is over', async () => {
          // Lock user
          await tryLogin()
          await tryLogin()

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
            id: lockedUser.docs[0]!.id,
            collection: slug,
            data: {
              lockUntil: manuallyReleaseLock,
            },
          })

          const userAfterUpdate = await payload.findByID({
            id: lockedUser.docs[0]!.id,
            collection: slug,
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

    it('should allow forgot-password by email', async () => {
      // TODO: Spy on payload sendEmail function
      const response = await restClient.POST(`/${slug}/forgot-password`, {
        body: JSON.stringify({
          email,
        }),
      })
      // expect(mailSpy).toHaveBeenCalled();

      expect(response.status).toBe(200)
    })

    it('should enforce the minimum request interval when reserving an email', async () => {
      const authConfig = payload.collections[slug].config.auth
      const originalMinRequestInterval = authConfig.forgotPassword.minRequestInterval
      const users = await Promise.all(
        ['repeated', 'disabled-email', 'after-reset'].map((name) =>
          payload.create({
            collection: slug,
            data: {
              email: `forgot-password-${name}-${uuid()}@example.com`,
              password,
            },
          }),
        ),
      )
      const sendEmail = vitest.spyOn(payload.email, 'sendEmail').mockResolvedValue(undefined)
      const collectionHooks = payload.collections[slug].config.hooks
      const originalBeforeOperation = collectionHooks.beforeOperation
      const originalBeforeChange = collectionHooks.beforeChange
      const originalAfterChange = collectionHooks.afterChange
      const beforeChange = vitest.fn()
      const afterChange = vitest.fn()
      const outerReq = { transactionID: 'outer-transaction' }
      let shouldDisableEmail = false
      collectionHooks.beforeOperation = [
        ...(originalBeforeOperation ?? []),
        ({ args }) => (shouldDisableEmail ? { ...args, disableEmail: true } : args),
      ]
      collectionHooks.beforeChange = [
        ...(originalBeforeChange ?? []),
        ({ data, req }) => {
          beforeChange(req.transactionID === outerReq.transactionID)
          return data
        },
      ]
      collectionHooks.afterChange = [
        ...(originalAfterChange ?? []),
        ({ doc }) => {
          afterChange()
          return doc
        },
      ]
      authConfig.forgotPassword.minRequestInterval = 300000

      try {
        const firstToken = await payload.forgotPassword({
          collection: slug,
          data: { email: users[0]!.email },
          req: outerReq,
        })
        const secondToken = await payload.forgotPassword({
          collection: slug,
          data: { email: users[0]!.email },
        })
        expect(firstToken).not.toBeNull()
        expect(beforeChange).toHaveBeenCalledWith(true)
        expect(afterChange).toHaveBeenCalledTimes(1)
        expect(outerReq.transactionID).toBe('outer-transaction')
        expect(secondToken).toBeNull()

        const tokenWithDisabledEmail = await payload.forgotPassword({
          collection: slug,
          data: { email: users[0]!.email },
          disableEmail: true,
        })
        expect(tokenWithDisabledEmail).not.toBeNull()

        beforeChange.mockClear()
        shouldDisableEmail = true
        await payload.forgotPassword({
          collection: slug,
          data: { email: users[1]!.email },
          req: outerReq,
        })
        expect(beforeChange).toHaveBeenCalledWith(true)
        shouldDisableEmail = false
        const tokenAfterDisabledEmail = await payload.forgotPassword({
          collection: slug,
          data: { email: users[1]!.email },
        })
        expect(tokenAfterDisabledEmail).not.toBeNull()

        const resetToken = await payload.forgotPassword({
          collection: slug,
          data: { email: users[2]!.email },
        })
        await payload.resetPassword({
          collection: slug,
          data: {
            password: `${password}-after-reset`,
            token: resetToken,
          },
          overrideAccess: true,
        })
        const tokenAfterReset = await payload.forgotPassword({
          collection: slug,
          data: { email: users[2]!.email },
        })
        expect(tokenAfterReset).toBeNull()
        expect(sendEmail).toHaveBeenCalledTimes(3)
      } finally {
        authConfig.forgotPassword.minRequestInterval = originalMinRequestInterval
        collectionHooks.beforeOperation = originalBeforeOperation
        collectionHooks.beforeChange = originalBeforeChange
        collectionHooks.afterChange = originalAfterChange
        sendEmail.mockRestore()
        await Promise.all(users.map((user) => payload.delete({ id: user.id, collection: slug })))
      }
    })

    it('should serialize concurrent reset email requests', async () => {
      const authConfig = payload.collections[slug].config.auth
      const originalMinRequestInterval = authConfig.forgotPassword.minRequestInterval
      const user = await payload.create({
        collection: slug,
        data: {
          email: `forgot-password-concurrent-${uuid()}@example.com`,
          password,
        },
      })
      let releaseFirstEmail: () => void = () => undefined
      const firstEmailPending = new Promise<void>((resolve) => {
        releaseFirstEmail = resolve
      })
      const sendEmail = vitest
        .spyOn(payload.email, 'sendEmail')
        .mockImplementationOnce(() => firstEmailPending)
        .mockResolvedValue(undefined)

      authConfig.forgotPassword.minRequestInterval = 300000

      try {
        const firstRequest = payload.forgotPassword({
          collection: slug,
          data: { email: user.email },
        })

        await vitest.waitFor(() => expect(sendEmail).toHaveBeenCalledTimes(1))

        const secondRequest = payload.forgotPassword({
          collection: slug,
          data: { email: user.email },
        })

        await new Promise((resolve) => setTimeout(resolve, 100))
        releaseFirstEmail()

        const [firstToken, secondToken] = await Promise.all([firstRequest, secondRequest])

        expect(firstToken).not.toBeNull()
        expect(secondToken).toBeNull()
        expect(sendEmail).toHaveBeenCalledTimes(1)
      } finally {
        authConfig.forgotPassword.minRequestInterval = originalMinRequestInterval
        releaseFirstEmail()
        sendEmail.mockRestore()
        await payload.delete({ id: user.id, collection: slug })
      }
    })

    it('should release the request interval after an email error', async () => {
      const authConfig = payload.collections[slug].config.auth
      const originalMinRequestInterval = authConfig.forgotPassword.minRequestInterval
      const user = await payload.create({
        collection: slug,
        data: {
          email: `forgot-password-email-error-${uuid()}@example.com`,
          password,
        },
      })
      const sendEmail = vitest
        .spyOn(payload.email, 'sendEmail')
        .mockRejectedValueOnce(new Error('Email provider unavailable'))
        .mockResolvedValue(undefined)

      authConfig.forgotPassword.minRequestInterval = 300000

      try {
        await expect(
          payload.forgotPassword({
            collection: slug,
            data: { email: user.email },
          }),
        ).rejects.toThrow('Email provider unavailable')

        const retryToken = await payload.forgotPassword({
          collection: slug,
          data: { email: user.email },
        })

        expect(retryToken).not.toBeNull()
        expect(sendEmail).toHaveBeenCalledTimes(2)
      } finally {
        authConfig.forgotPassword.minRequestInterval = originalMinRequestInterval
        sendEmail.mockRestore()
        await payload.delete({ id: user.id, collection: slug })
      }
    })

    it('should allow reset password', async () => {
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

    it('should return a user with read access from the password reset operation', async () => {
      const user = await payload.create({
        collection: slug,
        data: {
          email: `reset-field-access-${uuid()}@example.com`,
          password,
          restrictedField: 'restricted value',
        } as any,
      })

      try {
        const token = await payload.forgotPassword({
          collection: slug,
          data: { email: user.email },
          disableEmail: true,
        })
        const response = await restClient.POST(`/${slug}/reset-password`, {
          auth: false,
          body: JSON.stringify({ password, token }),
        })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.user.id).toBe(user.id)
        expect(result.user).not.toHaveProperty('restrictedField')
      } finally {
        await payload.delete({ id: user.id, collection: slug })
      }
    })

    it('should return a user with read access from the first user registration operation', async () => {
      // session-users has no seeded users, so first-register succeeds. The created
      // user is deleted afterward to keep the collection empty for other tests.
      const sessionUsersSlug = 'session-users'
      const email = `first-register-field-access-${uuid()}@example.com`
      let createdUserID: number | string | undefined

      try {
        const response = await restClient.POST(`/${sessionUsersSlug}/first-register`, {
          body: JSON.stringify({
            'confirm-password': password,
            email,
            password,
            restrictedField: 'restricted value',
          }),
        })
        const registered = await response.json()

        createdUserID = registered.user?.id

        expect(response.status).toBe(200)
        expect(registered.token).toBeDefined()
        expect(registered.user.email).toBe(email)
        expect(registered.user).not.toHaveProperty('restrictedField')
      } finally {
        if (createdUserID) {
          await payload.delete({ id: createdUserID, collection: sessionUsersSlug })
        }
      }
    })

    it('should enforce access control on the me route', async () => {
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

    it('should not allow refreshing an invalid token', async () => {
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

  describe('disableLocalStrategy', () => {
    it('should allow create of a user with disableLocalStrategy', async () => {
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

    it('should retain fields when auth.disableLocalStrategy.enableFields is true', () => {
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
        'resetPasswordRequestedAt',
        'loginAttempts',
        'lockUntil',
        'sessions',
      ])
    })

    it('should prevent login of user with disableLocalStrategy.', async () => {
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

    it('rest - should prevent login', async () => {
      const response = await restClient.POST(`/${partialDisableLocalStrategiesSlug}/login`, {
        body: JSON.stringify({
          email,
          password,
        }),
      })

      expect(response.status).toBe(403)
    })

    it('should allow to use password field', async () => {
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

  describe('API Key', () => {
    it('should authenticate via the correct API key user', async () => {
      const usersQuery = await payload.find({
        collection: apiKeysSlug,
      })

      const [user1, user2] = usersQuery.docs

      const success = await restClient
        .GET(`/${apiKeysSlug}/${user2.id}`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${user2.apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(success.apiKey).toStrictEqual(user2.apiKey)

      const fail = await restClient.GET(`/${apiKeysSlug}/${user1.id}`, {
        headers: {
          Authorization: `${apiKeysSlug} API-Key ${user2.apiKey}`,
        },
      })

      expect(fail.status).toStrictEqual(404)
    })

    it('should allow authentication with an API key saved with sha1', async () => {
      const usersQuery = await payload.find({
        collection: apiKeysSlug,
      })

      const [user] = usersQuery.docs as [ApiKey]

      const sha1Index = crypto
        .createHmac('sha256', payload.secret)
        .update(user.apiKey as string)
        .digest('hex')

      await payload.db.updateOne({
        id: user.id,
        collection: apiKeysSlug,
        data: {
          apiKeyIndex: sha1Index,
        },
      })

      const response = await restClient
        .GET(`/${apiKeysSlug}/${user?.id}`, {
          headers: {
            Authorization: `${apiKeysSlug} API-Key ${user?.apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(response.id).toStrictEqual(user.id)
    })

    it('should not remove an API key from a user when updating other fields', async () => {
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
          enableAPIKey: true,
        },
      })

      const userResult = await payload.find({
        collection: apiKeysSlug,
        where: {
          id: {
            equals: user.id,
          },
        },
      })

      expect(updatedUser.apiKey).toStrictEqual(user.apiKey)
      expect(userResult.docs[0].apiKey).toStrictEqual(user.apiKey)
    })

    it('should disable api key after updating apiKey: null', async () => {
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

    it('should disable api key after updating with enableAPIKey:false', async () => {
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

      expect(updatedUser.apiKey).toStrictEqual(apiKey)
      expect(response.user).toBeNull()
    })
  })

  describe('Local API', () => {
    it('should login via the local API', async () => {
      const authenticated = await payload.login({
        collection: slug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      expect(authenticated.token).toBeTruthy()
    })

    it('should return collection property on user documents', async () => {
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

    it('should return collection property on api-keys auth collection', async () => {
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

    it('should forget and reset password', async () => {
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

    it('should not allow reset password if forgotPassword expiration token is expired', async () => {
      // Mock Date.now() to simulate the forgotPassword call happening 6 minutes ago (current expiration is set to 5 minutes)
      const originalDateNow = Date.now
      const mockDateNow = vitest.spyOn(Date, 'now').mockImplementation(() => {
        // Move the current time back by 6 minutes (360,000 ms)
        return originalDateNow() - 6 * 60 * 1000
      })

      const authConfig = payload.collections[slug].config.auth
      const originalMinRequestInterval = authConfig.forgotPassword.minRequestInterval
      authConfig.forgotPassword.minRequestInterval = 0

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
        authConfig.forgotPassword.minRequestInterval = originalMinRequestInterval
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

    describe('Login Attempts', () => {
      const createdLoginAttemptUsers: Array<{
        collection: typeof publicUsersSlug | typeof slug
        id: number | string
      }> = []

      async function attemptLogin(email: string, password: string) {
        return payload.login({
          collection: slug,
          data: {
            email,
            password,
          },
          overrideAccess: false,
        })
      }

      async function createLoginAttemptUser({
        id,
        collection = slug,
        email,
      }: {
        collection?: typeof publicUsersSlug | typeof slug
        email: string
        id?: string
      }) {
        const user = await payload.create({
          collection,
          data: {
            ...(id ? { id } : {}),
            email,
            password,
          },
        })

        createdLoginAttemptUsers.push({ id: user.id, collection })

        return user
      }

      async function getLoginAttemptUser({
        id,
        collection = slug,
      }: {
        collection?: typeof publicUsersSlug | typeof slug
        id: number | string
      }) {
        return await payload.findByID({
          id,
          collection,
          overrideAccess: true,
          showHiddenFields: true,
        })
      }

      async function setLoginAttemptLock({
        id,
        collection = slug,
      }: {
        collection?: typeof publicUsersSlug | typeof slug
        id: number | string
      }) {
        await payload.db.updateOne({
          id,
          collection,
          data: {
            lockUntil: new Date(Date.now() + 600 * 1000).toISOString(),
            loginAttempts: 2,
          },
        })
      }

      afterEach(async () => {
        for (const { id, collection } of createdLoginAttemptUsers) {
          await payload.delete({
            id,
            collection,
          })
        }

        createdLoginAttemptUsers.length = 0
      })

      it('should reset the login attempts after a successful login', async () => {
        // fail 1
        try {
          const failedLogin = await attemptLogin(devUser.email, 'wrong-password')
          expect(failedLogin).toBeUndefined()
        } catch (error) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect((error as Error).message).toBe('The email or password provided is incorrect.')
        }

        // successful login 1
        const successfulLogin = await attemptLogin(devUser.email, devUser.password)
        expect(successfulLogin).toBeDefined()

        // fail 2
        try {
          const failedLogin = await attemptLogin(devUser.email, 'wrong-password')
          expect(failedLogin).toBeUndefined()
        } catch (error) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect((error as Error).message).toBe('The email or password provided is incorrect.')
        }

        // successful login 2 without exceeding attempts
        const successfulLogin2 = await attemptLogin(devUser.email, devUser.password)
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

      it('should lock the user after too many failed login attempts', async () => {
        const now = new Date()
        // fail 1
        try {
          const failedLogin = await attemptLogin(devUser.email, 'wrong-password')
          expect(failedLogin).toBeUndefined()
        } catch (error) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect((error as Error).message).toBe('The email or password provided is incorrect.')
        }

        // fail 2
        try {
          const failedLogin = await attemptLogin(devUser.email, 'wrong-password')
          expect(failedLogin).toBeUndefined()
        } catch (error) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect((error as Error).message).toBe('The email or password provided is incorrect.')
        }

        // fail 3
        try {
          const failedLogin = await attemptLogin(devUser.email, 'wrong-password')
          expect(failedLogin).toBeUndefined()
        } catch (error) {
          // eslint-disable-next-line vitest/no-conditional-expect
          expect((error as Error).message).toBe(
            'This user is locked due to having too many failed login attempts.',
          )
        }

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
        expect(new Date(user!.lockUntil!).getTime()).toBeGreaterThan(now.getTime())
      })

      it('should allow force unlocking of a user', async () => {
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

      it('should allow admin auth users to unlock any auth collection user by default', async () => {
        const adminUser = await createLoginAttemptUser({ email: `admin-${uuid()}@example.com` })
        const publicUser = await createLoginAttemptUser({
          collection: publicUsersSlug,
          email: `public-${uuid()}@example.com`,
        })

        await setLoginAttemptLock({ id: publicUser.id, collection: publicUsersSlug })

        const req = await createLocalReq({ user: adminUser }, payload)

        await payload.unlock({
          collection: publicUsersSlug,
          data: {
            email: publicUser.email,
          } as any,
          overrideAccess: false,
          req,
        })

        const unlockedUser = await getLoginAttemptUser({
          id: publicUser.id,
          collection: publicUsersSlug,
        })

        expect(unlockedUser.loginAttempts).toBe(0)
        expect(unlockedUser.lockUntil).toBeNull()
      })

      it('should deny default unlock access to non-admin auth users', async () => {
        const currentUser = await createLoginAttemptUser({
          collection: publicUsersSlug,
          email: `current-${uuid()}@example.com`,
        })
        const selectedUser = await createLoginAttemptUser({
          collection: publicUsersSlug,
          email: `selected-${uuid()}@example.com`,
        })

        await setLoginAttemptLock({ id: selectedUser.id, collection: publicUsersSlug })

        const req = await createLocalReq({ user: currentUser }, payload)

        await expect(
          payload.unlock({
            collection: publicUsersSlug,
            data: {
              email: selectedUser.email,
            } as any,
            overrideAccess: false,
            req,
          }),
        ).rejects.toThrow(Forbidden)

        const lockedUser = await getLoginAttemptUser({
          id: selectedUser.id,
          collection: publicUsersSlug,
        })

        expect(lockedUser.loginAttempts).toBe(2)
        expect(lockedUser.lockUntil).toBeDefined()
      })

      it('should always unlock after password reset', async () => {
        const user = await payload.create({
          collection: slug,
          data: {
            email: `unlock-on-reset-${uuid()}@example.com`,
            password: 'password-before-reset',
          },
        })

        try {
          await payload.db.updateOne({
            id: user.id,
            collection: slug,
            data: {
              lockUntil: new Date(Date.now() + 60000).toISOString(),
              loginAttempts: 2,
            },
          })

          const resetToken = await payload.forgotPassword({
            collection: slug,
            data: { email: user.email },
            disableEmail: true,
          })

          await payload.resetPassword({
            collection: slug,
            data: {
              password: 'password-after-reset',
              token: resetToken,
            },
            overrideAccess: true,
          })

          const unlockedUser = await payload.findByID({
            id: user.id,
            collection: slug,
            showHiddenFields: true,
          })

          expect(unlockedUser.loginAttempts).toBe(0)
          expect(unlockedUser.lockUntil).toBeNull()
        } finally {
          await payload.delete({ id: user.id, collection: slug })
        }
      })
    })
  })

  describe('Email - format validation', () => {
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
    it('should allow standard formatted emails', () => {
      expect(emailValidation('user@example.com', mockContext)).toBe(true)
      expect(emailValidation('user.name+alias@example.co.uk', mockContext)).toBe(true)
      expect(emailValidation('user-name@example.org', mockContext)).toBe(true)
      expect(emailValidation('user@ex--ample.com', mockContext)).toBe(true)
      expect(emailValidation("user'payload@example.org", mockContext)).toBe(true)
    })

    it('should not allow emails with double quotes', () => {
      expect(emailValidation('"user"@example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@"example.com"', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('"user@example.com"', mockContext)).toBe('validation:emailAddress')
    })

    it('should not allow emails with spaces', () => {
      expect(emailValidation('user @example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@ example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user name@example.com', mockContext)).toBe('validation:emailAddress')
    })

    it('should not allow emails with consecutive dots', () => {
      expect(emailValidation('user..name@example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example..com', mockContext)).toBe('validation:emailAddress')
    })

    it('should not allow emails with invalid domains', () => {
      expect(emailValidation('user@example', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example..com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example.c', mockContext)).toBe('validation:emailAddress')
    })

    it('should not allow domains starting or ending with a hyphen', () => {
      expect(emailValidation('user@-example.com', mockContext)).toBe('validation:emailAddress')
      expect(emailValidation('user@example-.com', mockContext)).toBe('validation:emailAddress')
    })
    it('should not allow emails that start with dot', () => {
      expect(emailValidation('.user@example.com', mockContext)).toBe('validation:emailAddress')
    })
    it('should not allow emails that have a comma', () => {
      expect(emailValidation('user,name@example.com', mockContext)).toBe('validation:emailAddress')
    })
  })

  describe('Sessions', () => {
    it('should set a session on a user', async () => {
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

    it('should log out a user and delete only the session being logged out', async () => {
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

    it('should refresh an existing session', async () => {
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

    it('should not authenticate a user who has a JWT but its session has been terminated', async () => {
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

    it('should clean up expired sessions when logging in', async () => {
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

    it('should not update updatedAt when creating a session', async () => {
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

    it('should not update updatedAt when logging out', async () => {
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

    it('should not update updatedAt when refreshing a session', async () => {
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

  describe('credential change sessions', () => {
    const createdUserIDs: Array<number | string> = []

    afterEach(async () => {
      for (const id of createdUserIDs) {
        await payload.delete({ id, collection: slug }).catch(() => null)
      }
      createdUserIDs.length = 0
    })

    it('should remove pre-existing sessions after a password reset', async () => {
      const userEmail = `session-reset-${Date.now()}@example.com`

      const user = await payload.create({
        collection: slug,
        data: { email: userEmail, password: 'original-pw' },
      })
      createdUserIDs.push(user.id)

      const preReset = await payload.login({
        collection: slug,
        data: { email: userEmail, password: 'original-pw' },
      })

      const preResetSid = jwtDecode<{ sid: string }>(String(preReset.token)).sid

      const resetToken = await payload.forgotPassword({
        collection: slug,
        data: { email: userEmail },
        disableEmail: true,
      })

      await payload.resetPassword({
        collection: slug,
        data: { password: 'new-pw', token: resetToken },
        overrideAccess: true,
      })

      const dbUser = await payload.db.find<User>({
        collection: slug,
        where: { email: { equals: userEmail } },
      })

      const remainingSessions = dbUser.docs[0]?.sessions ?? []
      expect(remainingSessions.find(({ id }) => id === preResetSid)).toBeUndefined()

      const meWithOldToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${preReset.token}` } })
        .then((res) => res.json())
      expect(meWithOldToken.user).toBeNull()
    })

    it('should remove other sessions when a user changes their own password', async () => {
      const userEmail = `session-change-${Date.now()}@example.com`

      const user = await payload.create({
        collection: slug,
        data: { email: userEmail, password: 'original-pw' },
      })
      createdUserIDs.push(user.id)

      const currentSession = await restClient
        .POST(`/${slug}/login`, {
          body: JSON.stringify({ email: userEmail, password: 'original-pw' }),
        })
        .then((res) => res.json())

      const otherSession = await restClient
        .POST(`/${slug}/login`, {
          body: JSON.stringify({ email: userEmail, password: 'original-pw' }),
        })
        .then((res) => res.json())

      await restClient.PATCH(`/${slug}/${user.id}`, {
        body: JSON.stringify({ password: 'changed-pw' }),
        headers: { Authorization: `JWT ${currentSession.token}` },
      })

      const meWithOtherToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${otherSession.token}` } })
        .then((res) => res.json())
      expect(meWithOtherToken.user).toBeNull()

      const meWithCurrentToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${currentSession.token}` } })
        .then((res) => res.json())
      expect(meWithCurrentToken.user?.id).toStrictEqual(user.id)
    })

    it('should remove all sessions when a password is changed without a live session', async () => {
      const userEmail = `session-admin-change-${Date.now()}@example.com`

      const user = await payload.create({
        collection: slug,
        data: { email: userEmail, password: 'original-pw' },
      })
      createdUserIDs.push(user.id)

      const existingSession = await payload.login({
        collection: slug,
        data: { email: userEmail, password: 'original-pw' },
      })

      await payload.update({
        id: user.id,
        collection: slug,
        data: { password: 'admin-changed-pw' },
      })

      const dbUser = await payload.db.find<User>({
        collection: slug,
        where: { email: { equals: userEmail } },
      })
      expect(dbUser.docs[0]?.sessions ?? []).toHaveLength(0)

      const meWithOldToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${existingSession.token}` } })
        .then((res) => res.json())
      expect(meWithOldToken.user).toBeNull()
    })

    it("should keep the acting user signed in when changing another user's password", async () => {
      const actingUserEmail = `session-acting-${Date.now()}@example.com`
      const otherUserEmail = `session-other-${Date.now()}@example.com`

      const actingUser = await payload.create({
        collection: slug,
        data: { email: actingUserEmail, password: 'original-pw', roles: ['admin'] },
      })
      createdUserIDs.push(actingUser.id)

      const otherUser = await payload.create({
        collection: slug,
        data: { email: otherUserEmail, password: 'original-pw' },
      })
      createdUserIDs.push(otherUser.id)

      const actingSession = await restClient
        .POST(`/${slug}/login`, {
          body: JSON.stringify({ email: actingUserEmail, password: 'original-pw' }),
        })
        .then((res) => res.json())

      const otherSession = await restClient
        .POST(`/${slug}/login`, {
          body: JSON.stringify({ email: otherUserEmail, password: 'original-pw' }),
        })
        .then((res) => res.json())

      const updateResponse = await restClient.PATCH(`/${slug}/${otherUser.id}`, {
        body: JSON.stringify({ password: 'changed-pw' }),
        headers: { Authorization: `JWT ${actingSession.token}` },
      })
      expect(updateResponse.status).toBe(200)

      const meWithOtherToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${otherSession.token}` } })
        .then((res) => res.json())
      expect(meWithOtherToken.user).toBeNull()

      const meWithActingToken = await restClient
        .GET(`/${slug}/me`, { headers: { Authorization: `JWT ${actingSession.token}` } })
        .then((res) => res.json())
      expect(meWithActingToken.user?.id).toStrictEqual(actingUser.id)
    })
  })
})
