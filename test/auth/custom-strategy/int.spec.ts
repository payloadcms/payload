import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../../helpers/NextRESTClient.js'

import { initPayloadInt } from '../../helpers/initPayloadInt.js'
import { usersSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const [code, secret, name] = ['test', 'strategy', 'Tester']

const headers = {
  'Content-Type': 'application/json',
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('AuthStrategies', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, 'auth/custom-strategy'))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('create user', () => {
    beforeAll(async () => {
      await restClient.POST(`/${usersSlug}`, {
        body: JSON.stringify({
          name,
          code,
          secret,
        }),
        headers,
      })
    })

    it('should return a logged in user from /me', async () => {
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
