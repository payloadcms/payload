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
    it('should create cache on document create', async () => {
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

    it('should return cached doc in findByID', async () => {
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

    it('should delete cache on document delete', async () => {
      const post = await createPost({ title: 'Cached Post' })

      // ensure it's cached
      const cacheBeforeDelete = await getCache<Post>({
        id: post.id,
        collection: postsSlug,
        payload,
      })

      expect(cacheBeforeDelete).toBeDefined()

      // delete the post
      await payload.delete({
        collection: postsSlug,
        id: post.id,
      })

      // check cache again
      const cacheAfterDelete = await getCache<Post>({
        id: post.id,
        collection: postsSlug,
        payload,
      })

      expect(cacheAfterDelete).toBeNull()
    })

    it('should populate relations from cache', async () => {
      // update the related doc in the bg, then get the parent doc's cache again
      // the relation should be populated from cache as well
      const relatedPost = await createPost({ title: 'Related Post' })
      const post = await createPost({ title: 'Parent Post', relationship: relatedPost.id })

      const cachedDoc = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        cache: true,
        overrideAccess: true,
        depth: 1,
      })

      expect(cachedDoc).toMatchObject({
        id: post.id,
        title: 'Parent Post',
        relationship: {
          id: relatedPost.id,
          title: 'Related Post',
        },
      })

      await updateCache<Post>({
        collection: postsSlug,
        payload,
        doc: {
          ...relatedPost,
          title: 'Related Post (Updated)',
        },
      })

      const updatedCache = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        cache: true,
        overrideAccess: true,
        depth: 1,
      })

      expect(updatedCache).toMatchObject({
        id: post.id,
        title: 'Parent Post',
        relationship: {
          id: relatedPost.id,
          title: 'Related Post (Updated)',
        },
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
