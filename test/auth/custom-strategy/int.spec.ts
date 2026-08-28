import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import testConfig from './config.js'
import { usersSlug } from './shared.js'

const [code, secret, name] = ['test', 'strategy', 'Tester']

const headers = {
  'Content-Type': 'application/json',
}

test.suite({ config: testConfig })('AuthStrategies', () => {
  test.describe('create user', () => {
    test.beforeEach(async ({ restClient }) => {
      await restClient.POST(`/${usersSlug}`, {
        body: JSON.stringify({
          name,
          code,
          secret,
        }),
        headers,
      })
    })

    test('should return a logged in user from /me', async ({ restClient }) => {
      const response = await restClient.GET(`/${usersSlug}/me`, {
        headers: {
          code,
          secret,
        },
      })

      const data = await response.json()

      // Expect that the auth strategy should be able to return headers
      expect(response.headers.has('Smile-For-Me')).toBeTruthy()
      expect(response.status).toBe(200)
      expect(data.user.name).toBe(name)
    })
  })
})
