import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { mediaSlug } from './collections/Media/index.js'
import { postsSlug } from './collections/Posts/index.js'

let payload: Payload
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('relationship-dependencies', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('local API example', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      context: {},
      data: {
        title: 'LOCAL API EXAMPLE',
      },
    })

    expect(newPost.title).toEqual('LOCAL API EXAMPLE')
  })

  it('rest API example', async () => {
    const loginRes: { token: string } = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())
    const token = loginRes.token

    const data: { doc: { title: string } } = await restClient
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

  it('should leave a post with a relation that no longer exists', async () => {
    const filePath = path.resolve(dirname, '../uploads/image.png')
    const file = await getFileByPath(filePath)

    const media = await payload.create({
      collection: mediaSlug,
      data: {},
      file: file!,
    })

    const postA = await payload.create({
      collection: postsSlug,
      context: {},
      data: {
        title: 'Post A (will be deleted)',
      },
    })

    const postB = (await payload.create({
      collection: postsSlug,
      context: {},
      data: {
        relatedMedia: media.id,
        relatedPosts: postA.id,
        title: 'Post B (references A and media)',
      } as Record<string, unknown>,
    })) as {
      id: string
      relatedMedia?: { id: string } | string
      relatedPosts?: { id: string } | string
    }

    const relatedPostId =
      typeof postB.relatedPosts === 'object' && postB.relatedPosts !== null
        ? postB.relatedPosts.id
        : postB.relatedPosts
    expect(relatedPostId).toEqual(postA.id)

    const relatedMediaId =
      typeof postB.relatedMedia === 'object' && postB.relatedMedia !== null
        ? postB.relatedMedia.id
        : postB.relatedMedia
    expect(relatedMediaId).toEqual(media.id)

    await payload.delete({
      id: media.id,
      collection: mediaSlug,
    })

    await payload.delete({
      id: postA.id,
      collection: postsSlug,
    })

    const postBAfter = (await payload.findByID({
      id: postB.id,
      collection: postsSlug,
    })) as { relatedMedia?: { id: string } | string; relatedPosts?: { id: string } | string }

    const relatedPostIdAfter =
      typeof postBAfter.relatedPosts === 'object' && postBAfter.relatedPosts !== null
        ? postBAfter.relatedPosts.id
        : postBAfter.relatedPosts
    expect(relatedPostIdAfter).toBeDefined()
    expect(relatedPostIdAfter).toEqual(postA.id)

    const relatedMediaIdAfter =
      typeof postBAfter.relatedMedia === 'object' && postBAfter.relatedMedia !== null
        ? postBAfter.relatedMedia.id
        : postBAfter.relatedMedia
    expect(relatedMediaIdAfter).toBeDefined()
    expect(relatedMediaIdAfter).toEqual(media.id)

    await payload.delete({
      id: postB.id,
      collection: postsSlug,
    })
  })
})
