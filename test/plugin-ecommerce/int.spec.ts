import path from 'path'
import { NotFound, type Payload } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('ecommerce', () => {
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

  beforeEach(async () => {
    // await payload.delete({
    //   collection: 'search',
    //   depth: 0,
    //   where: {
    //     id: {
    //       exists: true,
    //     },
    //   },
    // })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should add a variants collection', async () => {
    const variants = await payload.find({
      collection: 'variants',
      depth: 0,
      limit: 1,
    })

    expect(variants).toBeTruthy()
  })
})
