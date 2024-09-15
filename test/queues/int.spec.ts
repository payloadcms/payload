import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('can create new jobs', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.text).toEqual('LOCAL API EXAMPLE')
  })
})
