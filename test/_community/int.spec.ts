import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

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
        title: 'LOCAL API EXAMPLE',
      },
      context: {},
    })

    expect(newPost.title).toEqual('LOCAL API EXAMPLE')
  })

  it('rest API example', async () => {
    const data = await restClient
      .POST(`/${postsSlug}`, {
        body: JSON.stringify({
          title: 'REST API EXAMPLE',
        }),
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      .then((res) => res.json())

    expect(data.doc.title).toEqual('REST API EXAMPLE')
  })

  it('blocks benchmark', async () => {
    for (let i = 0; i < 100; i++) {
      await payload.create({
        collection: 'blocks-collection',
        data: {
          blocks: Array.from({ length: 100 }, () => ({
            blockType:
              Math.random() > 0.5
                ? 'test-block-2'
                : Math.random() > 0.5
                  ? 'test-block-1'
                  : 'test-block-3',
            title: 'asd',
          })),
        },
      })
    }

    let collection = 0
    let global = 0

    for (let i = 0; i < 100; i++) {
      await payload.updateGlobal({
        slug: 'blocks-global',
        data: {
          blocks: Array.from({ length: 100 }, () => ({
            blockType:
              Math.random() > 0.5
                ? 'test-block-2'
                : Math.random() > 0.5
                  ? 'test-block-1'
                  : 'test-block-3',
            title: 'asd',
          })),
        },
      })

      let now = Date.now()
      await payload.find({ collection: 'blocks-collection', limit: 1 })
      collection += Date.now() - now
      now = Date.now()
      await payload.findGlobal({ slug: 'blocks-global' })
      global += Date.now() - now
    }

    payload.logger.info(`COLLECTION - ${collection}MS`)
    payload.logger.info(`GLOBAL - ${global}MS`)
  })
})
