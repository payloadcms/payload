import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload/uploads'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
import configPromise from './config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser

describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(configPromise)
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
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'test' },
    })

    // Create image
    const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const media = await payload.create({
      collection: 'media',
      data: {},
      file: imageFile,
    })

    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        associatedMedia: media.id,
        array: [{ category: category.id }],
        categories: [category.id],
        postCategory: category.id,
        richText: {},
        text: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.associatedMedia?.id).toStrictEqual(media.id)
    expect(newPost.postCategory?.id).toStrictEqual(category.id)
    expect(newPost.categories[0]).toBeDefined()
    expect(newPost.array[0].category).toBeDefined()
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
