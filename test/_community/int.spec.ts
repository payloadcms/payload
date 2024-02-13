import type { Payload } from '../../packages/payload/src'

import { initPayloadTest } from '../helpers/configHelpers'
import { postsSlug } from './collections/Posts'

require('isomorphic-fetch')

let jwt

const headers = {
  'Content-Type': 'application/json',
}

let payload: Payload
let apiURL: string

describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const { payload: payloadClient, serverURL } = await initPayloadTest({
      __dirname,
      init: { local: false },
    })

    apiURL = `${serverURL}/api`
    payload = payloadClient
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

  beforeEach(() => {
    jest.resetModules()
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
    const newPost = await fetch(`${apiURL}/${postsSlug}`, {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `JWT ${jwt}`,
      },
      body: JSON.stringify({
        text: 'REST API EXAMPLE',
      }),
    }).then((res) => res.json())

    expect(newPost.doc.text).toEqual('REST API EXAMPLE')
  })
})
