import type { Payload } from '../../packages/payload/src'

import { GET as createGET, POST as createPOST } from '../../packages/next/src/routes/rest/index'
import { getPayload } from '../../packages/payload/src'
import { devUser } from '../credentials'
import { postsSlug } from './collections/Posts'
import config from './config'

let payload: Payload
let jwt

const GET = createGET(config)
const POST = createPOST(config)

const headers = {
  'Content-Type': 'application/json',
}
const { email, password } = devUser

describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    payload = await getPayload({ config })

    const req = new Request('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: new Headers(headers),
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await POST(req, {
      params: {
        slug: ['users', 'login'],
      },
    }).then((res) => res.json())

    jwt = data.token
  })

  beforeEach(() => {
    jest.resetModules()
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
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
    const req = new Request(`http://localhost:3000/posts`, {
      method: 'POST',
      headers: new Headers({
        ...headers,
        Authorization: `JWT ${jwt}`,
      }),
      body: JSON.stringify({
        text: 'REST API EXAMPLE',
      }),
    })

    const data = await POST(req, {
      params: {
        slug: ['posts'],
      },
    }).then((res) => res.json())

    expect(data.doc.text).toEqual('REST API EXAMPLE')
  })
})
