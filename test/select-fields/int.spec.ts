import type { Payload } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { createPost } from './post.js'

let payload: Payload
let restClient: NextRESTClient

let id: number | string
const collection = 'posts'

const serializeObject = (obj: unknown) => JSON.parse(JSON.stringify(obj))

describe('Select Fields', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(configPromise))
    const post = await createPost(payload)
    id = post.id
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('local', () => {
    // payload.find({})

    it('should select text only top level text field and ids', async () => {
      const post = await payload.findByID({
        collection,
        id,
        select: {
          title: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        title: expect.any(String),
        group: {},
        groupMultiple: {},
        groupArray: { array: [] },
        array: [],
        arrayMultiple: [],
        blocks: [],
      })
    })

    it('should select text and id inside of array', async () => {
      const post = await payload.findByID({
        collection,
        id,
        select: {
          array: {
            title: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
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
        collection,
        id,
        select: {
          arrayMultiple: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
        group: {},
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
        collection,
        id,
        select: {
          group: {
            title: true,
          },
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
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
        collection,
        id,
        select: {
          groupMultiple: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
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
        collection,
        id,
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
        collection,
        id,
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
        collection,
        id,
        select: {
          blocks: true,
        },
      })

      expect(serializeObject(post)).toEqual({
        id: expect.anything(),
        array: [],
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

    // it('should select all fields inside of block', async () => {
    //   const post = await payload.findByID({
    //     collection,
    //     id,
    //     select: {
    //       blocks: {
    //         section: true,
    //       },
    //     },
    //   })

    //   expect(post.title).toBeUndefined()

    //   expect(post.blocks[0].id).toBeDefined()
    //   expect(post.blocks[0].title).toBeDefined()
    //   expect(post.blocks[0].blockType).toBeDefined()
    //   expect(post.blocks[0].secondTitle).toBeDefined()
    // })

    // it('should select top level field and array', async () => {
    //   const post = await payload.findByID({
    //     collection,
    //     id,
    //     select: {
    //       title: true,
    //       array: true,
    //     },
    //   })

    //   expect(post.title).toBeDefined()

    //   expect(post.array[0].id).toBeDefined()
    //   expect(post.array[0].title).toBeDefined()
    // })

    // it('should select array and field in group', async () => {
    //   const post = await payload.findByID({
    //     collection,
    //     id,
    //     select: {
    //       array: true,
    //       groupMultiple: {
    //         titleFirst: true,
    //       },
    //     },
    //   })

    //   expect(post.title).toBeUndefined()

    //   expect(post.array[0].id).toBeDefined()
    //   expect(post.array[0].title).toBeDefined()

    //   expect(post.groupMultiple.titleFirst).toBeDefined()
    //   expect(post.groupMultiple.titleSecond).toBeUndefined()
    // })

    // it('should select text inside of nested to group array', async () => {
    //   const post = await payload.findByID({
    //     collection,
    //     id,
    //     select: {
    //       groupArray: {
    //         array: {
    //           title: true,
    //         },
    //       },
    //     },
    //   })

    //   expect(post.title).toBeUndefined()
    //   expect(post.createdAt).toBeUndefined()
    //   expect(post.updatedAt).toBeUndefined()

    //   expect(post.array[0].id).toBeDefined()
    //   expect(post.array[0].title).toBeUndefined()

    //   expect(post.group.title).toBeUndefined()

    //   expect(post.groupArray.title).toBeUndefined()
    //   expect(post.groupArray.array[0].id).toBeDefined()
    //   expect(post.groupArray.array[0].title).toBeDefined()
    // })
  })

  // TODO: REST tests.
  describe('REST', () => {})

  describe('graphql', () => {})
})
