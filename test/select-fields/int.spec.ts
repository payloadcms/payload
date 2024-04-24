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
        collection,
        id,
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
        collection,
        id,
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
        collection,
        id,
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
        collection,
        id,
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

  // TODO: REST tests.
  describe('REST', () => {})

  describe('graphql', () => {})
})
