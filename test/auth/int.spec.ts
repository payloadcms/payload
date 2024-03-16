import { GraphQLClient } from 'graphql-request'
import jwtDecode from 'jwt-decode'

import type { User } from '../../packages/payload/src/auth'

import payload from '../../packages/payload/src'
import configPromise from '../collections-graphql/config'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { namedSaveToJWTValue, saveToJWTKey, slug } from './shared'

require('isomorphic-fetch')

let apiUrl
let client: GraphQLClient

const headers = {
  'Content-Type': 'application/json',
}

const { email, password } = devUser

describe('Auth', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    apiUrl = `${serverURL}/api`
    const config = await configPromise
    const url = `${serverURL}${config.routes.api}${config.routes.graphQL}`
    client = new GraphQLClient(url)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

  describe('GraphQL - admin user', () => {
    let token
    let user
    beforeAll(async () => {
      // language=graphQL
      const query = `mutation {
          loginUser(email: "${devUser.email}", password: "${devUser.password}") {
              token
              user {
                  id
                  email
              }
          }
      }`
      const response = await client.request(query)
      user = response.loginUser.user
      token = response.loginUser.token
    })

    it('should login', async () => {
      expect(user.id).toBeDefined()
      expect(user.email).toEqual(devUser.email)
      expect(token).toBeDefined()
    })

    it('should have fields saved to JWT', async () => {
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
    beforeAll(async () => {
      await fetch(`${apiUrl}/${slug}/first-register`, {
        body: JSON.stringify({
          email,
          password,
        }),
        headers,
        method: 'post',
      })
    })

    it('should prevent registering a new first user', async () => {
      const response = await fetch(`${apiUrl}/${slug}/first-register`, {
        body: JSON.stringify({
          email: 'thisuser@shouldbeprevented.com',
          password: 'get-out',
        }),
        headers,
        method: 'post',
      })

      expect(response.status).toBe(403)
    })

    it('should login a user successfully', async () => {
      const response = await fetch(`${apiUrl}/${slug}/login`, {
        body: JSON.stringify({
          email,
          password,
        }),
        headers,
        method: 'post',
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBeDefined()
    })

    describe('logged in', () => {
      let token: string | undefined
      let loggedInUser: User | undefined

      beforeAll(async () => {
        const response = await fetch(`${apiUrl}/${slug}/login`, {
          body: JSON.stringify({
            email,
            password,
          }),
          headers,
          method: 'post',
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
        const response = await fetch(`${apiUrl}/${slug}/me`, {
          headers: {
            ...headers,
            Authorization: `JWT ${token}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
      })

      it('should have fields saved to JWT', async () => {
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

        const response = await fetch(`${apiUrl}/${slug}/me`, {
          headers: {
            ...headers,
            Authorization: `${slug} API-Key ${user?.apiKey}`,
          },
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.email).toBeDefined()
        expect(data.user.apiKey).toStrictEqual(apiKey)
      })

      it('should refresh a token and reset its expiration', async () => {
        const response = await fetch(`${apiUrl}/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
          method: 'post',
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

        const response = await fetch(`${apiUrl}/${slug}/refresh-token`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
          method: 'post',
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.custom).toBe('Goodbye, world!')
      })

      it('should allow a user to be created', async () => {
        const response = await fetch(`${apiUrl}/${slug}`, {
          body: JSON.stringify({
            email: 'name@test.com',
            password,
            roles: ['editor'],
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
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

      it('should block login for an unverified user', async () => {
        const unverifedEmail = 'verify@me.com'
        const response = await fetch(`${apiUrl}/public-users`, {
          body: JSON.stringify({
            email: unverifedEmail,
            password,
            roles: ['editor'],
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        })

        expect(response.status).toBe(201)

        const userResult = await payload.find({
          collection: 'public-users',
          limit: 1,
          showHiddenFields: true,
          where: {
            email: {
              equals: unverifedEmail,
            },
          },
        })

        const { _verificationToken, _verified } = userResult.docs[0]

        expect(_verified).toBe(false)
        expect(_verificationToken).toBeDefined()

        const loginResult = await fetch(`${apiUrl}/public-users/login`, {
          body: JSON.stringify({
            email: unverifedEmail,
            password,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'post',
        })

        expect(loginResult.status).toEqual(401)
      })

      it('should allow verification of a user', async () => {
        const emailToVerify = 'verify@me.com'
        const response = await fetch(`${apiUrl}/public-users`, {
          body: JSON.stringify({
            email: emailToVerify,
            password,
            roles: ['editor'],
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
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

        const verificationResponse = await fetch(
          `${apiUrl}/public-users/verify/${_verificationToken}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'post',
          },
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
          const response = await fetch(`${apiUrl}/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property },
            }),
            headers: {
              Authorization: `JWT ${token}`,
              'Content-Type': 'application/json',
            },
            method: 'post',
          })
          data = await response.json()
        })

        it('should create', async () => {
          expect(data.doc.key).toStrictEqual(key)
          expect(data.doc.value.property).toStrictEqual(property)
        })

        it('should read', async () => {
          const response = await fetch(`${apiUrl}/payload-preferences/${key}`, {
            headers: {
              Authorization: `JWT ${token}`,
              'Content-Type': 'application/json',
            },
            method: 'get',
          })
          data = await response.json()
          expect(data.key).toStrictEqual(key)
          expect(data.value.property).toStrictEqual(property)
        })

        it('should update', async () => {
          const response = await fetch(`${apiUrl}/payload-preferences/${key}`, {
            body: JSON.stringify({
              value: { property: 'updated', property2: 'test' },
            }),
            headers: {
              Authorization: `JWT ${token}`,
              'Content-Type': 'application/json',
            },
            method: 'post',
          })

          data = await response.json()

          const result = await payload.find({
            collection: 'payload-preferences',
            depth: 0,
            where: {
              key: { equals: key },
            },
          })

          expect(data.doc.key).toStrictEqual(key)
          expect(data.doc.value.property).toStrictEqual('updated')
          expect(data.doc.value.property2).toStrictEqual('test')

          expect(result.docs).toHaveLength(1)
        })

        it('should delete', async () => {
          const response = await fetch(`${apiUrl}/payload-preferences/${key}`, {
            headers: {
              Authorization: `JWT ${token}`,
              'Content-Type': 'application/json',
            },
            method: 'delete',
          })

          data = await response.json()

          const result = await payload.find({
            collection: 'payload-preferences',
            depth: 0,
            where: {
              key: { equals: key },
            },
          })

          expect(result.docs).toHaveLength(0)
        })
      })

      describe('Account Locking', () => {
        const userEmail = 'lock@me.com'

        const tryLogin = async () => {
          await fetch(`${apiUrl}/${slug}/login`, {
            body: JSON.stringify({
              email: userEmail,
              password: 'bad',
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'post',
          })
          // expect(loginRes.status).toEqual(401);
        }

        beforeAll(async () => {
          const response = await fetch(`${apiUrl}/${slug}/login`, {
            body: JSON.stringify({
              email,
              password,
            }),
            headers,
            method: 'post',
          })

          const data = await response.json()
          token = data.token

          // New user to lock
          await fetch(`${apiUrl}/${slug}`, {
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

          await payload.update({
            collection: slug,
            data: {
              lockUntil: Date.now() - 605 * 1000,
            },
            where: {
              email: {
                equals: userEmail,
              },
            },
          })

          // login
          await fetch(`${apiUrl}/${slug}/login`, {
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
      const response = await fetch(`${apiUrl}/${slug}/forgot-password`, {
        body: JSON.stringify({
          email,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'post',
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

      const response = await fetch(`${apiUrl}/${slug}/login`, {
        body: JSON.stringify({
          email: 'insecure@me.com',
          password: 'test',
        }),
        headers,
        method: 'post',
      })

      const data = await response.json()
      const adminMe = await fetch(`${apiUrl}/${slug}/me`, {
        headers: {
          Authorization: `JWT ${data.token}`,
        },
      }).then((res) => res.json())
      expect(adminMe.user.adminOnlyField).toEqual('admin secret')

      await payload.update({
        id: user?.id || '',
        collection: slug,
        data: {
          roles: ['editor'],
        },
      })

      const editorMe = await fetch(`${apiUrl}/${slug}/me`, {
        headers: {
          Authorization: `JWT ${adminMe?.token}`,
        },
      }).then((res) => res.json())
      expect(editorMe.user.adminOnlyField).toBeUndefined()
    })

    it('should not allow refreshing an invalid token', async () => {
      const response = await fetch(`${apiUrl}/${slug}/refresh-token`, {
        body: JSON.stringify({
          token: 'INVALID',
        }),
        headers,
        method: 'post',
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

      const success = await fetch(`${apiUrl}/api-keys/${user2.id}`, {
        headers: {
          Authorization: `api-keys API-Key ${user2.apiKey}`,
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json())

      expect(success.apiKey).toStrictEqual(user2.apiKey)

      const fail = await fetch(`${apiUrl}/api-keys/${user1.id}`, {
        headers: {
          Authorization: `api-keys API-Key ${user2.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      expect(fail.status).toStrictEqual(404)
    })
  })
})
