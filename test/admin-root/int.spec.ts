import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { postsSlug } from './collections/Posts/index.js'

let token: string

const { email, password } = devUser

test.suite({ config: './config.ts' })('Admin (Root) Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  test.beforeEach(async ({ restClient }) => {
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

  // --__--__--__--__--__--__--__--__--__
  // You can run tests against the local API or the REST API
  // use the tests below as a guide
  // --__--__--__--__--__--__--__--__--__

  test('local API example', async ({ payload }) => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.text).toEqual('LOCAL API EXAMPLE')
  })

  test('rest API example', async ({ restClient }) => {
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
