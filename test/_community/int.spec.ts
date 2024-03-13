import type { Payload } from '../../packages/payload/src/index.js'
import { getPayload } from '../../packages/payload/src/index.js'
import { devUser } from '../credentials.js'
import { NextRESTClient } from '../helpers/NextRESTClient.js'
import { startMemoryDB } from '../startMemoryDB.js'
import { postsSlug } from './collections/Posts/index.js'
import configPromise from './config.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser

describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
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

  // --__--__--__--__--__--__--__--__--__
  // You can run tests against the local API or the REST API
  // use the tests below as a guide
  // --__--__--__--__--__--__--__--__--__

  it('local API example', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.text).toEqual('LOCAL API EXAMPLE')
  })

  it('rest API example', async () => {
    const data = await restClient
      .POST(`/${postsSlug}`, {
        body: JSON.stringify({
          text: 'REST API EXAMPLE',
        }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      .then((res) => res.json())

    expect(data.doc.text).toEqual('REST API EXAMPLE')
  })
})
