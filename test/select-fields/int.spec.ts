import type { Payload } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { createDeepNested } from './deep-nested.js'
import { createDocWithRelation } from './doc-with-relation.js'
import { createGlobal, globalSlug } from './global.js'
import { createLocalizedPost } from './localizedPost.js'
import { createPost } from './post.js'

let payload: Payload
let restClient: NextRESTClient

let postId: number | string
const postsSlug = 'posts'

let deepNestedId: number | string
const deepNestedSlug = 'deep-nested'

let localizedPostId: number | string
const localizedPostsSlug = 'localized-posts'

let docWithRelationId: number | string
const docWithRelationSlug = 'relationships'

describe('Select Fields', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(configPromise))
    const post = await createPost(payload)
    postId = post.id

    const deepNested = await createDeepNested(payload)
    deepNestedId = deepNested.id

    const localizedPost = await createLocalizedPost(payload)
    localizedPostId = localizedPost.id

    const docWithRelation = await createDocWithRelation(payload)
    docWithRelationId = docWithRelation.id

    await createGlobal(payload)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Local - Base fields', () => {
    it('should select text only top level text field and ids', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['title'],
      })
      expect(post).toEqual({
        id: postId,
        title: post.title,
      })
    })
    it('should select text and id inside of array', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['array.title'],
      })

      expect(post).toEqual({
        id: postId,
        array: [
          {
            title: post.array[0].title,
            id: post.array[0].id,
          },
        ],
      })
    })
    it('should all fields inside of array', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['arrayMultiple'],
      })

      expect(post).toEqual({
        id: postId,
        arrayMultiple: [
          {
            id: post.arrayMultiple[0].id,
            titleFirst: post.arrayMultiple[0].titleFirst,
            titleSecond: post.arrayMultiple[0].titleSecond,
          },
        ],
      })
    })
    it('should select text inside of group', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['group.title'],
      })

      expect(post).toEqual({
        id: postId,
        group: {
          title: post.group.title,
        },
      })
    })
    it('should select all fields inside of group', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['groupMultiple'],
      })

      expect(post).toEqual({
        id: postId,
        groupMultiple: {
          titleFirst: post.groupMultiple.titleFirst,
          titleSecond: post.groupMultiple.titleSecond,
        },
      })
    })
    it('should select text inside of blocks that have slug section', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['blocks.section.title'],
      })

      expect(post).toEqual({
        id: postId,
        blocks: [
          {
            title: post.blocks[0].title,
            blockType: 'section',
            id: post.blocks[0].id,
          },
          {
            blockType: 'cta',
            id: post.blocks[0].id,
          },
        ],
      })
    })
    it('should select all fields inside of blocks 2 slugs', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['blocks.cta', 'blocks.section'],
      })

      expect(post).toEqual({
        id: postId,
        blocks: [
          {
            title: post.blocks[0].title,
            blockType: 'section',
            id: post.blocks[0].id,
            secondTitle: post.blocks[0].secondTitle,
          },
          {
            cta: post.blocks[1].cta,
            blockType: 'cta',
            id: post.blocks[1].id,
          },
        ],
      })
    })
    it('should select all fields inside of blocks any slug', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['blocks'],
      })

      expect(post).toEqual({
        id: postId,
        blocks: [
          {
            title: post.blocks[0].title,
            blockType: 'section',
            id: post.blocks[0].id,
            secondTitle: post.blocks[0].secondTitle,
          },
          {
            cta: post.blocks[1].cta,
            blockType: 'cta',
            id: post.blocks[1].id,
          },
        ],
      })
    })

    it('should select "select" field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['select'],
      })
      expect(post).toEqual({
        id: postId,
        select: ['hello', 'world'],
      })
    })

    it('should select title inside of tab field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['tab.title'],
      })

      expect(post).toEqual({
        id: postId,
        tab: {
          title: post.tab.title,
        },
      })
    })
    it('should select all fields inside of tab field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: ['tab'],
      })

      expect(post).toEqual({
        id: postId,
        tab: {
          title: post.tab.title,
          label: post.tab.label,
        },
      })
    })
  })

  describe('Local - deep nested fields', () => {
    it('should select deep array-group nested text field', async () => {
      const deepNested = await payload.findByID({
        collection: deepNestedSlug,
        id: deepNestedId,
        select: ['array.group.array.title'],
      })

      expect(deepNested).toEqual({
        id: deepNestedId,
        array: [
          {
            id: deepNested.array[0].id,
            group: {
              array: [
                {
                  id: deepNested.array[0].group.array[0].id,
                  title: deepNested.array[0].group.array[0].title,
                },
              ],
            },
          },
        ],
      })
    })
  })

  describe('Local - localized', () => {
    it('should select localized title in en', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: ['title'],
      })

      expect(localizedPost).toEqual({
        id: localizedPostId,
        title: localizedPost.title,
      })
    })

    it('should select localized title in de locale', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'de',
        select: ['title'],
      })

      expect(localizedPost).toEqual({
        title: 'title de',
        id: localizedPostId,
      })
    })

    it('should select localized array and title in en', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: ['title', 'arrayLocalized'],
      })

      console.log(localizedPost)

      expect(localizedPost).toEqual({
        id: localizedPostId,
        title: 'title en',
        arrayLocalized: [
          {
            id: localizedPost.arrayLocalized[0].id,
            title: 'title en',
          },
        ],
      })
    })

    it('should select field inside of localized array', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: ['arrayLocalized.title'],
      })

      expect(localizedPost).toEqual({
        id: localizedPostId,
        arrayLocalized: [
          {
            id: localizedPost.arrayLocalized[0].id,
            title: 'title en',
          },
        ],
      })
    })

    it('should select localized field inside of array', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: ['array.title'],
      })

      expect(localizedPost).toEqual({
        id: localizedPostId,
        array: [
          {
            id: localizedPost.array[0].id,
            title: 'title en',
          },
        ],
      })
    })

    it('should select localized field inside of localized blocks', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: ['blocks.some.title'],
      })

      expect(localizedPost).toEqual({
        id: localizedPostId,
        blocks: [
          {
            blockType: 'some',
            id: localizedPost.blocks[0].id,
            title: 'title en',
          },
        ],
      })
    })
  })

  describe('Relationships population', () => {
    it('should populate relationship and exclude another one', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 1,
        populate: {
          item: true,
        },
      })

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeTruthy()
      expect(doc.other.title).toBeUndefined()
    })

    it('should populate relationship with the selected fields', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 1,
        populate: {
          item: {
            select: ['title'],
          },
        },
      })

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeUndefined()
      expect(doc.other.title).toBeUndefined()
    })

    it('should automatically populate nested relationship as result of depth', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 2,
        populate: {
          item: true,
        },
      })

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeTruthy()
      expect(doc.item.nested.title).toBeTruthy()
      expect(doc.item.nested.subtitle).toBeTruthy()
    })

    it('should populate nested relationship doc', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 2,
        populate: {
          item: {
            populate: {
              nested: true,
            },
          },
        },
      })

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeTruthy()
      expect(doc.item.nested.title).toBeTruthy()
      expect(doc.item.nested.subtitle).toBeTruthy()
    })

    it('should populate nested relationship doc with the selected fields', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 2,
        populate: {
          item: {
            populate: {
              nested: {
                select: ['title'],
              },
            },
          },
        },
      })

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeTruthy()
      expect(doc.item.nested.title).toBeTruthy()
      expect(doc.item.nested.subtitle).toBeUndefined()
    })

    it('should populate nested relationship within array and exclude other', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 1,
        populate: {
          'array.item': true,
        },
      })

      expect(doc.item.title).toBeUndefined()
      expect(doc.array[0].item.title).toBeTruthy()
    })

    it('should populate polymorphic relationship doc with the selected fields', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        populate: {
          polymorphic: [
            {
              relationTo: 'relationships-items-nested',
              value: {
                select: ['title'],
              },
            },
          ],
        },
      })

      expect(doc.polymorphic.value.title).toBeTruthy()
      expect(doc.polymorphic.value.subtitle).toBeFalsy()
    })

    it('should respect defaultPopulate select', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 1,
      })

      expect(doc.withDefaultPopulate.title).toBeTruthy()
      expect(doc.withDefaultPopulate.subtitle).toBeUndefined()
    })

    it('should respect defaultPopulate select polymorphic', async () => {
      const doc = await payload.findByID({
        collection: docWithRelationSlug,
        id: docWithRelationId,
        depth: 1,
      })

      expect(doc.polymorphicDefault.value.title).toBeTruthy()
      expect(doc.polymorphicDefault.value.subtitle).toBeUndefined()
    })

    it('should populate and select fields in globals', async () => {
      const global = await payload.findGlobal({
        slug: globalSlug,
        populate: {
          relFirst: {
            select: ['title'],
          },
        },
      })

      expect(global.relFirst.title).toBe('title')
      expect(global.relFirst.subtitle).toBeUndefined()

      expect(global.relSecond.title).toBeUndefined()
      expect(global.relSecond.subtitle).toBeUndefined()
    })
  })

  describe('REST', () => {
    it('should select text and id inside of array', async () => {
      const res = await restClient.GET(`/${postsSlug}/${postId}`, {
        query: {
          select: ['array.title'],
        },
      })

      const post = await res.json()

      expect(post).toEqual({
        id: postId,

        array: [
          {
            title: post.array[0].title,
            id: post.array[0].id,
          },
        ],
      })
    })

    it('should populate relationship with the selected fields', async () => {
      const res = await restClient.GET(`/${docWithRelationSlug}/${docWithRelationId}`, {
        query: {
          populate: {
            item: {
              select: ['title'],
            },
          },
        },
      })

      const doc = await res.json()

      expect(doc.item.title).toBeTruthy()
      expect(doc.item.subtitle).toBeUndefined()
      expect(doc.other.title).toBeUndefined()
    })

    it('should populate and select fields in globals', async () => {
      const res = await restClient.GET(`/globals/${globalSlug}`, {
        query: {
          populate: {
            relFirst: {
              select: ['title'],
            },
          },
        },
      })

      const global = await res.json()

      expect(global.relFirst.title).toBe('title')
      expect(global.relFirst.subtitle).toBeUndefined()

      expect(global.relSecond.title).toBeUndefined()
      expect(global.relSecond.subtitle).toBeUndefined()
    })
  })
})
