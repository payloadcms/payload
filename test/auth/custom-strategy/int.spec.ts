import type { Payload } from '../../../packages/payload/src/index.js'

import { getPayload } from '../../../packages/payload/src/index.js'
import { NextRESTClient } from '../../helpers/NextRESTClient.js'
import { startMemoryDB } from '../../startMemoryDB.js'
import configPromise from './config.js'
import { usersSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const [code, secret, name] = ['test', 'strategy', 'Tester']

const headers = {
  'Content-Type': 'application/json',
}

describe('AuthStrategies', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
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

      expect(response.status).toBe(200)
      expect(data.user.name).toBe(name)
    })
  })
})
