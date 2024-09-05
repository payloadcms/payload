import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Page, Post } from './payload-types.js'

import { devUser, regularUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email: devEmail, password: devPassword } = devUser
const { email: regEmail, password: regPassword } = regularUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Locked Documents', () => {
  let post1: Post
  let page1: Page
  let user1: any
  let user2: any

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  beforeEach(async () => {
    post1 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'SOME POST',
      },
    })

    page1 = await payload.create({
      collection: pagesSlug,
      data: {
        text: 'SOME PAGE',
      },
    })

    user2 = await payload.create({
      collection: 'users',
      data: {
        email: regEmail,
        password: regPassword,
      },
    })

    user1 = await payload.login({
      collection: 'users',
      data: {
        email: devEmail,
        password: devPassword,
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

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
