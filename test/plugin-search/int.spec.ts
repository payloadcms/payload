import { describe, beforeAll, beforeEach, afterAll, it, expect } from 'vitest'
import type { Payload } from 'payload'

import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '@tools/test-utils/int'

import { devUser } from '@tools/test-utils/shared'
import { initPayloadInt } from '@tools/test-utils/int'
import { pagesSlug, postsSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-search', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email: devUser.email,
          password: devUser.password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  beforeEach(async () => {
    await payload.delete({
      collection: 'search',
      depth: 0,
      where: {
        id: {
          exists: true,
        },
      },
    })
    await Promise.all([
      payload.delete({
        collection: postsSlug,
        depth: 0,
        where: {
          id: {
            exists: true,
          },
        },
      }),
      payload.delete({
        collection: pagesSlug,
        depth: 0,
        where: {
          id: {
            exists: true,
          },
        },
      }),
    ])
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should add a search collection', async () => {
    const search = await payload.find({
      collection: 'search',
      depth: 0,
      limit: 1,
    })

    expect(search).toBeTruthy()
  })

  it('should sync published pages to the search collection', async () => {
    const pageToSync = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        excerpt: 'This is a test page',
        title: 'Hello, world!',
      },
    })

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: pageToSync.id,
        },
      },
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(pageToSync.id)
    expect(results[0].title).toBe('Hello, world!')
    expect(results[0].excerpt).toBe('This is a test page')
  })

  it('should not sync drafts pages to the search collection', async () => {
    const draftPage = await payload.create({
      collection: 'pages',
      data: {
        _status: 'draft',
        excerpt: 'This is a test page',
        title: 'Hello, world!',
      },
    })

    // wait for the search document to be potentially created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: draftPage.id,
        },
      },
    })

    expect(results).toHaveLength(0)
  })

  it('should not delete a search doc if a published item has a new draft but remains published', async () => {
    const publishedPage = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Published title!',
      },
    })

    // wait for the search document to be potentially created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: publishedPage.id,
        },
      },
    })

    expect(results).toHaveLength(1)

    // Create a new draft
    await payload.update({
      collection: 'pages',
      id: publishedPage.id,
      draft: true,
      data: {
        _status: 'draft',
        title: 'Draft title!',
      },
    })

    // This should remain with the published content
    const { docs: updatedResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: publishedPage.id,
        },
      },
    })

    expect(updatedResults).toHaveLength(1)

    await payload.update({
      collection: 'pages',
      id: publishedPage.id,
      data: {
        _status: 'draft',
        title: 'Drafted again',
      },
    })

    // Should now be deleted given we've unpublished the page
    const { docs: deletedResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: publishedPage.id,
        },
      },
    })

    expect(deletedResults).toHaveLength(0)
  })

  it('should sync changes made to an existing search document', async () => {
    const pageToReceiveUpdates = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        excerpt: 'This is a test page',
        title: 'Hello, world!',
      },
    })

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: pageToReceiveUpdates.id,
        },
      },
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(pageToReceiveUpdates.id)
    expect(results[0].title).toBe('Hello, world!')
    expect(results[0].excerpt).toBe('This is a test page')

    await payload.update({
      id: pageToReceiveUpdates.id,
      collection: 'pages',
      data: {
        excerpt: 'This is a test page (updated)',
        title: 'Hello, world! (updated)',
      },
    })

    // wait for the search document to be potentially updated
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    // Do not add `limit` to this query, this way we can test if multiple documents were created
    const { docs: updatedResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: pageToReceiveUpdates.id,
        },
      },
    })

    expect(updatedResults).toHaveLength(1)
    expect(updatedResults[0].doc.value).toBe(pageToReceiveUpdates.id)
    expect(updatedResults[0].title).toBe('Hello, world! (updated)')
    expect(updatedResults[0].excerpt).toBe('This is a test page (updated)')
  })

  it('should clear the search document when the original document is deleted', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        excerpt: 'This is a test page',
        title: 'Hello, world!',
      },
    })

    // wait for the search document to be created
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: page.id,
        },
      },
    })

    expect(results).toHaveLength(1)
    expect(results[0].doc.value).toBe(page.id)

    await payload.delete({
      id: page.id,
      collection: 'pages',
    })

    // wait for the search document to be potentially deleted
    // we do not await this within the `syncToSearch` hook
    await wait(200)

    const { docs: deletedResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        id: {
          equals: results[0].id,
        },
      },
    })

    expect(deletedResults).toHaveLength(0)
  })

  it('should clear the proper search document when having the same doc.value but different doc.relationTo', async () => {
    const custom_id_1 = await payload.create({
      collection: 'custom-ids-1',
      data: { id: 'custom_id' },
    })

    await payload.create({
      collection: 'custom-ids-2',
      data: { id: 'custom_id' },
    })

    await wait(200)

    const {
      docs: [docBefore],
    } = await payload.find({
      collection: 'search',
      where: { 'doc.value': { equals: 'custom_id' } },
      limit: 1,
      sort: 'createdAt',
    })

    expect(docBefore.doc.relationTo).toBe('custom-ids-1')

    await payload.delete({ collection: 'custom-ids-1', id: custom_id_1.id })

    await wait(200)

    const {
      docs: [docAfter],
    } = await payload.find({
      collection: 'search',
      where: { 'doc.value': { equals: 'custom_id' } },
      limit: 1,
      sort: 'createdAt',
    })

    expect(docAfter.doc.relationTo).toBe('custom-ids-2')
  })

  it('should sync localized data', async () => {
    const createdDoc = await payload.create({
      collection: 'posts',
      data: {
        _status: 'published',
        title: 'test title',
        slug: 'es',
      },
      locale: 'es',
    })

    await payload.update({
      collection: 'posts',
      id: createdDoc.id,
      data: {
        _status: 'published',
        title: 'test title',
        slug: 'en',
      },
      locale: 'en',
    })

    const syncedSearchData = await payload.find({
      collection: 'search',
      locale: 'es',
      where: {
        and: [
          {
            'doc.value': {
              equals: createdDoc.id,
            },
          },
        ],
      },
    })

    expect(syncedSearchData.docs[0].slug).toEqual('es')
  })

  it('should respond with 401 when invalid permissions on user before reindex', async () => {
    const testCreds = {
      email: 'test@payloadcms.com',
      password: 'test',
    }

    await payload.create({
      collection: 'users',
      data: testCreds,
    })

    const testUserRes = await restClient.POST(`/users/login`, {
      body: JSON.stringify(testCreds),
    })

    const testUser = await testUserRes.json()

    const endpointRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: [postsSlug],
      }),
      headers: {
        Authorization: `JWT ${testUser.token}`,
      },
    })

    expect(endpointRes.status).toEqual(401)
  })

  it('should respond with 400 when invalid collection args passed to reindex', async () => {
    const endpointNoArgsRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({}),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    const endpointEmptyArrRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: [],
      }),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    const endpointInvalidArrRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: ['users'],
      }),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    expect(endpointNoArgsRes.status).toBe(400)
    expect(endpointEmptyArrRes.status).toBe(400)
    expect(endpointInvalidArrRes.status).toBe(400)
  })

  it('should delete existing search indexes before reindexing', async () => {
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'post_1',
        _status: 'published',
      },
    })

    await wait(200)

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'post_2',
        _status: 'published',
      },
    })

    const { docs } = await payload.find({ collection: 'search' })

    await wait(200)

    const endpointRes = await restClient.POST('/search/reindex', {
      body: JSON.stringify({
        collections: [postsSlug],
      }),
    })

    expect(endpointRes.status).toBe(200)

    await wait(200)

    const { docs: results } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        id: {
          in: docs.map((doc) => doc.id),
        },
      },
    })

    // Should have no docs with these ID
    // after reindex since it deletes indexes and recreates them
    expect(results).toHaveLength(0)
  })

  it('should reindex whole collections', async () => {
    await Promise.all([
      payload.create({
        collection: pagesSlug,
        data: {
          title: 'Test page title',
          _status: 'published',
        },
      }),
      payload.create({
        collection: postsSlug,
        data: {
          title: 'Test page title',
          _status: 'published',
        },
      }),
    ])

    await wait(200)

    const { totalDocs: totalBeforeReindex } = await payload.count({
      collection: 'search',
    })

    const endpointRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: [postsSlug, pagesSlug],
      }),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    expect(endpointRes.status).toBe(200)

    const { totalDocs: totalAfterReindex } = await payload.count({
      collection: 'search',
    })

    expect(totalAfterReindex).toBe(totalBeforeReindex)
  })

  it('should exclude drafts from reindexing by default', async () => {
    await Promise.all([
      payload.create({
        collection: pagesSlug,
        data: {
          title: 'Test page published',
          _status: 'published',
        },
      }),
      payload.create({
        collection: pagesSlug,
        data: {
          title: 'Test page draft',
          _status: 'draft',
        },
      }),
    ])

    await wait(200)

    const { totalDocs: totalBeforeReindex } = await payload.count({
      collection: 'search',
    })

    expect(totalBeforeReindex).toBe(1)

    const endpointRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: [pagesSlug],
      }),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    expect(endpointRes.status).toBe(200)

    const { totalDocs: totalAfterReindex } = await payload.count({
      collection: 'search',
    })

    expect(totalAfterReindex).toBe(totalBeforeReindex)

    const data = await endpointRes.json()

    const totalDocs = 2
    const nonDrafts = 1
    expect(data.message).toBe(
      `Successfully reindexed ${nonDrafts} of ${totalDocs} documents from ${pagesSlug} and skipped ${totalDocs - nonDrafts} drafts.`,
    )
  })

  it('should reindex all configured locales', async () => {
    const post = await payload.create({
      collection: postsSlug,
      locale: 'en',
      data: {
        title: 'Test page published',
        _status: 'published',
        slug: 'test-en',
      },
    })
    await payload.update({
      collection: postsSlug,
      id: post.id,
      locale: 'es',
      data: {
        _status: 'published',
        slug: 'test-es',
      },
    })
    await payload.update({
      collection: postsSlug,
      id: post.id,
      locale: 'de',
      data: {
        _status: 'published',
        slug: 'test-de',
      },
    })

    const {
      docs: [postBeforeReindex],
    } = await payload.find({
      collection: 'search',
      locale: 'all',
      where: {
        doc: {
          equals: {
            value: post.id,
            relationTo: postsSlug,
          },
        },
      },
      pagination: false,
      limit: 1,
      depth: 0,
    })

    expect(postBeforeReindex?.slug).not.toBeFalsy()

    const endpointRes = await restClient.POST(`/search/reindex`, {
      body: JSON.stringify({
        collections: [postsSlug],
      }),
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    expect(endpointRes.status).toBe(200)

    const {
      docs: [postAfterReindex],
    } = await payload.find({
      collection: 'search',
      locale: 'all',
      where: {
        doc: {
          equals: {
            value: post.id,
            relationTo: postsSlug,
          },
        },
      },
      pagination: false,
      limit: 1,
      depth: 0,
    })

    expect(postAfterReindex?.slug).not.toBeFalsy()
    expect(postAfterReindex?.slug).toStrictEqual(postBeforeReindex?.slug)
  })

  it('should sync trashed documents correctly with search plugin', async () => {
    // Create a published post
    const publishedPost = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Post to be trashed',
        excerpt: 'This post will be soft deleted',
        _status: 'published',
      },
    })

    // Wait for the search document to be created
    await wait(200)

    // Verify the search document was created
    const { docs: initialSearchResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: publishedPost.id,
        },
      },
    })

    expect(initialSearchResults).toHaveLength(1)
    expect(initialSearchResults[0]?.title).toBe('Post to be trashed')

    // Soft delete the post (move to trash)
    await payload.update({
      collection: postsSlug,
      id: publishedPost.id,
      data: {
        deletedAt: new Date().toISOString(),
      },
    })

    // Wait for the search plugin to sync the trashed document
    await wait(200)

    // Verify the search document still exists but is properly synced
    // The search document should remain and be updated correctly
    const { docs: trashedSearchResults } = await payload.find({
      collection: 'search',
      depth: 0,
      where: {
        'doc.value': {
          equals: publishedPost.id,
        },
      },
    })

    // The search document should still exist
    expect(trashedSearchResults).toHaveLength(0)

    // Clean up by permanently deleting the trashed post
    await payload.delete({
      collection: postsSlug,
      id: publishedPost.id,
      trash: true, // permanently delete
    })
  })

  describe('locale filtering', () => {
    it('should filter locales when skipSync excludes them', async () => {
      // Test config has 3 locales: ['en', 'es', 'de']
      // For 'filtered-locales' collection with syncEnglishOnly: true, only 'en' should be indexed

      // Create a doc with syncEnglishOnly enabled
      const enDoc = await payload.create({
        collection: 'filtered-locales',
        data: {
          title: 'Filtered Doc',
          syncEnglishOnly: true,
        },
        locale: 'en',
      })

      // Query for ALL search docs with locale: 'all' to see total count
      const { docs: allSearchDocs } = await payload.find({
        collection: 'search',
        locale: 'all',
        where: {
          'doc.value': {
            equals: enDoc.id,
          },
        },
      })

      // Should only have 1 search doc total (English only)
      expect(allSearchDocs).toHaveLength(1)
      expect(allSearchDocs[0]?.doc.relationTo).toBe('filtered-locales')

      // Verify the search doc exists for English locale
      const { docs } = await payload.find({
        collection: 'search',
        locale: 'all',
        where: {
          'doc.value': {
            equals: enDoc.id,
          },
        },
      })

      expect(docs).toHaveLength(1)

      const doc = docs[0]
      expect(doc).toBeDefined()
      expect(doc.doc.relationTo).toBe('filtered-locales')
      expect(doc.title).toHaveProperty('en', 'Filtered Doc')
      expect(doc.title).not.toHaveProperty('es')
      expect(doc.title).not.toHaveProperty('de')

      // Clean up
      await payload.delete({
        collection: 'filtered-locales',
        id: enDoc.id,
      })
    })

    it('should index all locales when skipSync allows all locales', async () => {
      // Test config has 3 locales: ['en', 'es', 'de']
      // For 'posts' collection, skipSync returns false for all locales

      // Create a post
      const post = await payload.create({
        collection: postsSlug,
        data: {
          _status: 'published',
          title: 'Test Post for All Locales',
        },
        locale: 'en',
      })

      // Update the post in Spanish locale
      await payload.update({
        collection: postsSlug,
        id: post.id,
        locale: 'es',
        data: {
          _status: 'published',
          title: 'Test Post para Todos los Locales',
        },
      })

      // Update the post in German locale
      await payload.update({
        collection: postsSlug,
        id: post.id,
        locale: 'de',
        data: {
          _status: 'published',
          title: 'Testbeitrag für alle Sprachen',
        },
      })

      // Query for search doc with locale: 'all'
      const { docs: allSearchDocs } = await payload.find({
        collection: 'search',
        locale: 'all',
        where: {
          'doc.value': {
            equals: post.id,
          },
        },
      })

      // Should have 1 search doc with all locales embedded
      expect(allSearchDocs).toHaveLength(1)
      expect(allSearchDocs[0]?.doc.relationTo).toBe(postsSlug)
      // Verify all locales are present in the localized title field
      expect(allSearchDocs[0]?.title).toHaveProperty('en', 'Test Post for All Locales')
      expect(allSearchDocs[0]?.title).toHaveProperty('es', 'Test Post para Todos los Locales')
      expect(allSearchDocs[0]?.title).toHaveProperty('de', 'Testbeitrag für alle Sprachen')

      // Clean up
      await payload.delete({
        collection: postsSlug,
        id: post.id,
      })
    })

    it('should index all locales when syncEnglishOnly is false', async () => {
      // For 'filtered-locales' collection with syncEnglishOnly: false, all locales should be indexed

      // Create a doc with syncEnglishOnly disabled
      const doc = await payload.create({
        collection: 'filtered-locales',
        data: {
          title: 'Unfiltered Doc',
          syncEnglishOnly: false,
        },
        locale: 'en',
      })

      // Verify search doc exists for English
      const { docs: enSearchDocs } = await payload.find({
        collection: 'search',
        locale: 'en',
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
      })
      expect(enSearchDocs).toHaveLength(1)

      // Verify search doc exists for Spanish
      const { docs: esSearchDocs } = await payload.find({
        collection: 'search',
        locale: 'es',
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
      })
      expect(esSearchDocs).toHaveLength(1)

      // Verify search doc exists for German
      const { docs: deSearchDocs } = await payload.find({
        collection: 'search',
        locale: 'de',
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
      })
      expect(deSearchDocs).toHaveLength(1)

      // Clean up
      await payload.delete({
        collection: 'filtered-locales',
        id: doc.id,
      })
    })
  })
})
