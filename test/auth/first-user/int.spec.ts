import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { test } from '../../__helpers/int/vitest.js'
import { firstUsersSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

test.suite('First user registration', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(({ payloadInstance, restClientInstance }) => {
    payload = payloadInstance
    restClient = restClientInstance
  })

  test('should return a user with read access from the first user registration operation', async () => {
    // first-users has no seeded users, so first-register succeeds. The created
    // user is deleted afterward to keep the collection empty for other tests.
    const email = 'first-user@example.com'
    const password = 'test'
    let createdUserID: number | string | undefined

    try {
      const response = await restClient.POST(`/${firstUsersSlug}/first-register`, {
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
        await payload.delete({
          id: createdUserID,
          collection: firstUsersSlug as any,
          overrideAccess: true,
        })
      }
    }
  })
})
