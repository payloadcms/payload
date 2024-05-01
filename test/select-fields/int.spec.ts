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

const serializeObject = (obj: unknown) => JSON.parse(JSON.stringify(obj))

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
        select: {
          title: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        title: expect.any(String),
        group: {},
        tab: {},
        groupMultiple: {},
        groupArray: { array: [] },
        array: [],
        arrayMultiple: [],
        blocks: [],
      })
    })

    it('should select text and id inside of array', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          array: {
            title: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        tab: {},
        array: [
          {
            title: expect.any(String),
            id: expect.any(String),
          },
        ],
        group: {},
        groupMultiple: {},
        arrayMultiple: [],
        blocks: [],
        groupArray: {
          array: [],
        },
      })
    })

    it('should all fields inside of array', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          arrayMultiple: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        group: {},
        tab: {},
        groupMultiple: {},
        arrayMultiple: [
          {
            id: expect.any(String),
            titleFirst: expect.any(String),
            titleSecond: expect.any(String),
          },
        ],
        blocks: [],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select text inside of group', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          group: {
            title: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        tab: {},
        group: {
          title: expect.any(String),
        },
        groupMultiple: {},
        arrayMultiple: [],
        blocks: [],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select all fields inside of group', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          groupMultiple: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        tab: {},
        group: {},
        groupMultiple: {
          titleFirst: expect.any(String),
          titleSecond: expect.any(String),
        },
        arrayMultiple: [],
        blocks: [],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select text inside of blocks that have slug section', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          blocks: {
            section: {
              title: true,
            },
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        tab: {},
        group: {},
        groupMultiple: {},
        arrayMultiple: [],
        blocks: [
          {
            title: expect.any(String),
            blockType: 'section',
            id: expect.any(String),
            blockName: null,
          },
          {
            blockType: 'cta',
            blockName: null,
            id: expect.any(String),
          },
        ],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select all fields inside of blocks 2 slugs', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          blocks: {
            cta: true,
            section: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        tab: {},
        group: {},
        groupMultiple: {},
        arrayMultiple: [],
        blocks: [
          {
            title: expect.any(String),
            blockType: 'section',
            id: expect.any(String),
            blockName: null,
            secondTitle: expect.any(String),
          },
          {
            cta: expect.any(String),
            blockType: 'cta',
            id: expect.any(String),
            blockName: null,
          },
        ],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select all fields inside of blocks any slug', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          blocks: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        group: {},
        tab: {},
        groupMultiple: {},
        arrayMultiple: [],
        blocks: [
          {
            title: expect.any(String),
            blockType: 'section',
            id: expect.any(String),
            blockName: null,
            secondTitle: expect.any(String),
          },
          {
            cta: expect.any(String),
            blockType: 'cta',
            id: expect.any(String),
            blockName: null,
          },
        ],
        groupArray: {
          array: [],
        },
      })
    })

    it('should select "select" field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          select: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        select: ['hello', 'world'],
        group: {},
        groupMultiple: {},
        tab: {},
        groupArray: { array: [] },
        array: [],
        arrayMultiple: [],
        blocks: [],
      })
    })

    it('should select title inside of tab field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          tab: {
            title: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        group: {},
        groupMultiple: {},
        tab: {
          title: expect.any(String),
        },
        groupArray: { array: [] },
        array: [],
        arrayMultiple: [],
        blocks: [],
      })
    })

    it('should select all fields inside of tab field', async () => {
      const post = await payload.findByID({
        collection: postsSlug,
        id: postId,
        select: {
          tab: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        group: {},
        groupMultiple: {},
        tab: {
          title: expect.any(String),
          label: expect.any(String),
        },
        groupArray: { array: [] },
        array: [],
        arrayMultiple: [],
        blocks: [],
      })
    })
  })

  describe('Local - deep nested fields', () => {
    it('should select deep array-group nested text field', async () => {
      const deepNested = await payload.findByID({
        collection: deepNestedSlug,
        id: deepNestedId,
        select: {
          array: {
            group: {
              array: {
                title: true,
              },
            },
          },
        },
      })

      expect(serializeObject(deepNested)).toEqual({
        id: expect.anything(),
        blocks: [],
        array: [
          {
            id: expect.any(String),
            group: {
              array: [
                {
                  id: expect.any(String),
                  title: expect.any(String),
                },
              ],
            },
          },
        ],
      })
    })

    it('should select deep array-group nested from parent', async () => {
      const deepNested = await payload.findByID({
        collection: deepNestedSlug,
        id: deepNestedId,
        select: {
          array: true,
        },
      })

      expect(serializeObject(deepNested)).toEqual({
        id: expect.anything(),
        blocks: [],
        array: [
          {
            id: expect.any(String),
            group: {
              title: expect.any(String),
              array: [
                {
                  id: expect.any(String),
                  title: expect.any(String),
                },
              ],
            },
          },
        ],
      })
    })

    it('should select deep nested from blocks', async () => {
      const deepNested = await payload.findByID({
        collection: deepNestedSlug,
        id: deepNestedId,
        select: {
          blocks: {
            first: {
              array: {
                group: {
                  title: true,
                },
              },
            },
            second: {
              group: {
                title: true,
              },
            },
          },
        },
      })

      expect(serializeObject(deepNested)).toEqual({
        id: expect.anything(),
        array: [],
        blocks: [
          {
            id: expect.any(String),
            blockType: 'first',
            blockName: null,
            array: [
              {
                id: expect.any(String),
                group: {
                  title: expect.any(String),
                },
              },
            ],
          },
          {
            id: expect.any(String),
            blockName: null,
            blockType: 'second',
            group: {
              title: expect.any(String),
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
        select: {
          title: true,
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        id: expect.anything(),
        array: [],
        arrayLocalized: [],
        blocks: [],
        title: expect.any(String),
      })
    })

    it('should select localized title in de locale', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'de',
        select: {
          title: true,
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        title: 'title de',
        id: expect.anything(),
        array: [],
        blocks: [],
        arrayLocalized: [],
      })
    })

    it('should select localized array and title in en', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: {
          title: true,
          arrayLocalized: true,
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        id: expect.anything(),
        array: [],
        title: 'title en',
        blocks: [],
        arrayLocalized: [
          {
            id: expect.any(String),
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
        select: {
          arrayLocalized: { title: true },
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        id: expect.anything(),
        array: [],
        blocks: [],
        arrayLocalized: [
          {
            id: expect.any(String),
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
        select: {
          array: { title: true },
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        id: expect.anything(),
        blocks: [],
        array: [
          {
            id: expect.any(String),
            title: 'title en',
          },
        ],
        arrayLocalized: [],
      })
    })

    it('should select localized field inside of localized blocks', async () => {
      const localizedPost = await payload.findByID({
        id: localizedPostId,
        collection: localizedPostsSlug,
        locale: 'en',
        select: {
          blocks: {
            some: {
              title: true,
            },
          },
        },
      })

      expect(serializeObject(localizedPost)).toEqual({
        id: expect.anything(),
        blocks: [
          {
            blockType: 'some',
            id: expect.any(String),
            blockName: null,
            title: 'title en',
          },
        ],
        array: [],
        arrayLocalized: [],
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
            select: {
              title: true,
            },
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
                select: {
                  title: true,
                },
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
                select: {
                  title: true,
                },
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
            select: {
              title: true,
            },
          },
        },
      })

      console.log(global)
      expect(global.relFirst.title).toBe('title')
      expect(global.relFirst.subtitle).toBeUndefined()

      expect(global.relSecond.title).toBeUndefined()
      expect(global.relSecond.subtitle).toBeUndefined()
    })
  })

  // TODO: REST tests.
  describe('REST', () => {})

  describe('graphql', () => {})
})
