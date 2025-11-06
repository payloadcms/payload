import type { Payload } from 'payload'

import path from 'path'
import { getCache, updateCache } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Post } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

describe('cache', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  beforeEach(async () => {
    await clearDocs()
  })

  describe('Local API', () => {
    it('should cache doc on create', async () => {
      const post = await createPost({ title: 'Cached Post' })

      // check the KV store directly to ensure it's cached
      const cache = await getCache<Post>({
        id: post.id,
        collection: postsSlug,
        payload,
      })

      expect(cache).toMatchObject({
        doc: expect.objectContaining({
          id: post.id,
          title: 'Cached Post',
        }),
      })
    })

    it('should return cached doc on find', async () => {
      const title = 'Cached Post'

      const post = await createPost({ title })

      const cacheTitle = `${title} (Updated)`

      await updateCache<Post>({
        collection: postsSlug,
        payload,
        doc: {
          ...post,
          title: cacheTitle,
        },
      })

      // First read to ensure it's cached on create
      const doc = await payload.findByID({
        collection: postsSlug,
        id: post.id,
      })

      expect(doc).toMatchObject({
        id: post.id,
        title: 'Cached Post',
      })

      // First read to ensure it's cached on create
      const cachedDoc = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        cache: true,
      })

      expect(cachedDoc).toMatchObject({
        id: post.id,
        title: cacheTitle,
      })
    })
  })
})

async function createPost(overrides?: Partial<Post>) {
  const { doc } = await restClient
    .POST(`/${postsSlug}`, {
      body: JSON.stringify({ title: 'title', ...overrides }),
    })
    .then((res) => res.json())
  return doc
}

async function createPosts(count: number) {
  for (let i = 0; i < count; i++) {
    await createPost()
  }
}

async function clearDocs(): Promise<void> {
  await payload.delete({
    collection: postsSlug,
    where: { id: { exists: true } },
  })
}
