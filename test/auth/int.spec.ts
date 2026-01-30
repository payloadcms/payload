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
import { email as emailValidation } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vitest } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { ApiKey } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  apiKeysSlug,
  namedSaveToJWTValue,
  partialDisableLocalStrategiesSlug,
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

          expect(result.docs[0].value.property).toStrictEqual('updated')
          expect(result.docs[0].value.property2).toStrictEqual('updated')

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

          expect(lockedUser.docs[0].loginAttempts).toBe(2)
          expect(lockedUser.docs[0].lockUntil).toBeDefined()

          const manuallyReleaseLock = new Date(Date.now() - 605 * 1000).toISOString()
          const userLockElapsed = await payload.update({
            collection: slug,
            data: {
              lockUntil: manuallyReleaseLock,
            },
            showHiddenFields: true,
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          expect(userLockElapsed.docs[0].lockUntil).toEqual(manuallyReleaseLock)

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

    describe('Login Attempts', () => {
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
})
