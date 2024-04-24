import type { Payload } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { createDeepNested } from './deep-nested.js'
import { createPost } from './post.js'

let payload: Payload
let restClient: NextRESTClient

let postId: number | string
const postsSlug = 'posts'
let deepNestedId: number | string
const deepNestedSlug = 'deep-nested'

const serializeObject = (obj: unknown) => JSON.parse(JSON.stringify(obj))

describe('Select Fields', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(configPromise))
    const post = await createPost(payload)
    postId = post.id
    const deepNested = await createDeepNested(payload)
    deepNestedId = deepNested.id
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Local - Base fields', () => {
    // payload.find({})

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
            title: expect.any(String),
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
            title: expect.any(String),
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

    it('should select nested from blocks', async () => {
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
            blockType: 'second',
            group: {
              title: expect.any(String),
            },
          },
        ],
      })
    })
  })

  // TODO: REST tests.
  describe('REST', () => {})

  describe('graphql', () => {})
})
