import path from 'path'
import { NotFound, type Payload } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { tenantsSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-multi-tenant', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email: devUser.email,
          password: devUser.password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('tenants', () => {
    it('should create a tenant', async () => {
      const tenant1 = await payload.create({
        collection: tenantsSlug,
        data: {
          name: 'tenant1',
          domain: 'tenant1.com',
        },
      })

      expect(tenant1).toHaveProperty('id')
    })
  })
})
