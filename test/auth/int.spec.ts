import type { Payload, User } from 'payload'

import { jwtDecode } from 'jwt-decode'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '@test-utils/credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { apiKeysSlug, namedSaveToJWTValue, saveToJWTKey, slug } from './shared.js'

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
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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
      expect(data.token).toBeDefined()
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
        const response = await restClient.POST(`/public-users`, {
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
          collection: 'public-users',
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
          `/public-users/verify/${_verificationToken}`,
        )

        expect(verificationResponse.status).toBe(200)

        const afterVerifyResult = await payload.find({
          collection: 'public-users',
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

        const tryLogin = async () => {
          await restClient.POST(`/${slug}/login`, {
            body: JSON.stringify({
              email: userEmail,
              password: 'bad',
            }),
          })
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

        it('should lock the user after too many attempts', async () => {
          await tryLogin()
          await tryLogin()
          await tryLogin() // Let it call multiple times, therefore the unlock condition has no bug.

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

          expect(loginAttempts).toBe(2)
          expect(lockUntil).toBeDefined()
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

  describe('API Key', () => {
    it('should authenticate via the correct API key user', async () => {
      const usersQuery = await payload.find({
        collection: 'api-keys',
      })

      const [user1, user2] = usersQuery.docs

      const success = await restClient
        .GET(`/api-keys/${user2.id}`, {
          headers: {
            Authorization: `api-keys API-Key ${user2.apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(success.apiKey).toStrictEqual(user2.apiKey)

      const fail = await restClient.GET(`/api-keys/${user1.id}`, {
        headers: {
          Authorization: `api-keys API-Key ${user2.apiKey}`,
        },
      })

      expect(fail.status).toStrictEqual(404)
    })

    it('should not remove an API key from a user when updating other fields', async () => {
      const apiKey = uuid()
      const user = await payload.create({
        collection: 'api-keys',
        data: {
          apiKey,
          enableAPIKey: true,
        },
      })

      const updatedUser = await payload.update({
        id: user.id,
        collection: 'api-keys',
        data: {
          enableAPIKey: true,
        },
      })

      const userResult = await payload.find({
        collection: 'api-keys',
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
        .GET(`/api-keys/me`, {
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
        .GET(`/api-keys/me`, {
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
  })
})
