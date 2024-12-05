import path from 'path'
import { deepCopyObject, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type {
  Config,
  DeepPost,
  GlobalPost,
  LocalizedPost,
  Page,
  Point,
  Post,
  VersionedPost,
} from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Select', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Local API - Base', () => {
    let post: Post
    let postId: number | string

    let point: Point
    let pointId: number | string

    beforeEach(async () => {
      post = await createPost()
      postId = post.id

      point = await createPoint()
      pointId = point.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'posts' })
      await payload.delete({ id: pointId, collection: 'points' })
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select only select', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            select: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          select: post.select,
        })
      })

      it('should select only hasMany select', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            selectMany: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          selectMany: post.selectMany,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: post.group,
        })
      })

      it('should select text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group.text,
          },
        })
      })

      it('should select all the fields inside of named tab', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            tab: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          tab: post.tab,
        })
      })

      it('should select text field inside of named tab', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            tab: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          tab: {
            text: post.tab.text,
          },
        })
      })

      it('should select text field inside of unnamed tab', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            unnamedTabText: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          unnamedTabText: post.unnamedTabText,
        })
      })

      it('should select id as default from array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array,
        })
      })

      it('should select text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) => ({ blockType: block.blockType, id: block.id })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks,
        })
      })

      it('should select all the fields inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? block
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? { id: block.id, blockType: block.blockType, ctaText: block.ctaText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a point field', async () => {
        if (payload.db.name === 'sqlite') {
          return
        }

        const res = await payload.findByID({
          collection: 'points',
          id: pointId,
          select: { point: true },
        })

        expect(res).toStrictEqual({
          id: pointId,
          point: point.point,
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: false,
          },
        })

        const expected = { ...post }

        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude select', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            select: false,
          },
        })

        const expected = { ...post }

        delete expected['select']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude hasMany select', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            selectMany: false,
          },
        })

        const expected = { ...post }

        delete expected['selectMany']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number and text', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: false,
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']
        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: false,
          },
        })

        const expected = { ...post }

        delete expected['group']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: false,
          },
        })

        const expected = { ...post }

        delete expected['array']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: false,
          },
        })

        const expected = { ...post }

        delete expected['blocks']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude all the fields inside of specific block while keeping base fields', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) => {
            delete block['ctaText']

            return block
          }),
        })
      })

      it('should exclude a point field', async () => {
        if (payload.db.name === 'sqlite') {
          return
        }
        const res = await payload.findByID({
          collection: 'points',
          id: pointId,
          select: { point: false },
        })

        const copy = { ...point }

        delete copy['point']

        expect(res).toStrictEqual(copy)
      })
    })
  })

  describe('Local API - Localization', () => {
    let post: LocalizedPost
    let postId: number | string

    beforeEach(async () => {
      post = await createLocalizedPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'localized-posts' })
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select only select', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            select: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          select: post.select,
        })
      })

      it('should select only hasMany select', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            selectMany: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          selectMany: post.selectMany,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: post.group,
        })
      })

      it('should select text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group.text,
          },
        })
      })

      it('should select localized text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            groupSecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          groupSecond: {
            text: post.groupSecond.text,
          },
        })
      })

      it('should select id as default from array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array,
        })
      })

      it('should select text field inside of localized array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select localized text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            arraySecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          arraySecond: post.arraySecond.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) => ({ blockType: block.blockType, id: block.id })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks,
        })
      })

      it('should select all the fields inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? block
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? { id: block.id, blockType: block.blockType, ctaText: block.ctaText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific localized field inside of specific block 1', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              second: { text: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'second'
              ? { id: block.id, blockType: block.blockType, text: block.text }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific localized field inside of specific block 2', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              first: { firstText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'first'
              ? { id: block.id, blockType: block.blockType, firstText: block.firstText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: false,
          },
        })

        const expected = { ...post }

        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude select', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            select: false,
          },
        })

        const expected = { ...post }

        delete expected['select']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude hasMany select', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            selectMany: false,
          },
        })

        const expected = { ...post }

        delete expected['selectMany']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number and text', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: false,
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']
        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: false,
          },
        })

        const expected = { ...post }

        delete expected['group']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude localized text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            groupSecond: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.groupSecond.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: false,
          },
        })

        const expected = { ...post }

        delete expected['array']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude localized text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            arraySecond: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          arraySecond: post.arraySecond.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: false,
          },
        })

        const expected = { ...post }

        delete expected['blocks']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude all the fields inside of specific block while keeping base fields', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) => {
            delete block['ctaText']

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 1', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              second: { text: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocksSecond: post.blocksSecond.map((block) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (block.blockType === 'second') {
              delete block['text']
            }

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 2', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              first: { firstText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocksSecond: post.blocksSecond.map((block) => {
            delete block['firstText']

            return block
          }),
        })
      })
    })
  })

  describe('Local API - Deep Fields', () => {
    let post: DeepPost
    let postId: number | string

    beforeEach(async () => {
      post = await createDeepPost()
      postId = post.id
    })

    it('should select deply group.array.group.text', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'deep-posts',
        select: { group: { array: { group: { text: true } } } },
      })

      expect(res).toStrictEqual({
        id: postId,
        group: {
          array: post.group.array.map((item) => ({
            id: item.id,
            group: {
              text: item.group.text,
            },
          })),
        },
      })
    })

    it('should select deply group.array.group.*', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'deep-posts',
        select: { group: { array: { group: true } } },
      })

      expect(res).toStrictEqual({
        id: postId,
        group: {
          array: post.group.array.map((item) => ({
            id: item.id,
            group: item.group,
          })),
        },
      })
    })

    it('should select deply group.blocks.block.text', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'deep-posts',
        select: { group: { blocks: { block: { text: true } } } },
      })

      expect(res).toStrictEqual({
        id: postId,
        group: {
          blocks: post.group.blocks.map((item) => ({
            id: item.id,
            blockType: item.blockType,
            text: item.text,
          })),
        },
      })
    })

    it('should select deply array.array.text', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'deep-posts',
        select: { arrayTop: { arrayNested: { text: true } } },
      })

      expect(res).toStrictEqual({
        id: postId,
        arrayTop: post.arrayTop.map((item) => ({
          id: item.id,
          arrayNested: item.arrayNested.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })),
      })
    })
  })

  describe('Local API - Versioned Drafts Collection', () => {
    let post: VersionedPost
    let postId: number | string

    beforeEach(async () => {
      post = await createVersionedPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'versioned-posts' })
    })

    it('should select only id as default', async () => {
      const res = await payload.findByID({
        collection: 'versioned-posts',
        id: postId,
        select: {},
        draft: true,
      })

      expect(res).toStrictEqual({
        id: postId,
      })
    })

    it('should select only number', async () => {
      const res = await payload.findByID({
        collection: 'versioned-posts',
        id: postId,
        select: {
          number: true,
        },
        draft: true,
      })

      expect(res).toStrictEqual({
        id: postId,
        number: post.number,
      })
    })

    it('should exclude only number', async () => {
      const res = await payload.findByID({
        collection: 'versioned-posts',
        id: postId,
        select: {
          number: false,
        },
        draft: true,
      })

      const expected = { ...post }

      delete expected['number']
      expect(res).toStrictEqual(expected)
    })

    it('should select number and text', async () => {
      const res = await payload.findByID({
        collection: 'versioned-posts',
        id: postId,
        select: {
          number: true,
          text: true,
        },
        draft: true,
      })

      expect(res).toStrictEqual({
        id: postId,
        number: post.number,
        text: post.text,
      })
    })

    it('payload.find should select number and text', async () => {
      const res = await payload.find({
        collection: 'versioned-posts',
        where: {
          id: {
            equals: postId,
          },
        },
        select: {
          number: true,
          text: true,
        },
        draft: true,
      })

      expect(res.docs[0]).toStrictEqual({
        id: postId,
        number: post.number,
        text: post.text,
      })
    })

    it('should select base id field inside of array', async () => {
      const res = await payload.find({
        collection: 'versioned-posts',
        where: {
          id: {
            equals: postId,
          },
        },
        select: {
          array: {},
        },
        draft: true,
      })

      expect(res.docs[0]).toStrictEqual({
        id: postId,
        array: post.array.map((each) => ({ id: each.id })),
      })
    })

    it('should select base id field inside of blocks', async () => {
      const res = await payload.find({
        collection: 'versioned-posts',
        where: {
          id: {
            equals: postId,
          },
        },
        select: {
          blocks: {},
        },
        draft: true,
      })

      expect(res.docs[0]).toStrictEqual({
        id: postId,
        blocks: post.blocks.map((each) => ({ blockType: each.blockType, id: each.id })),
      })
    })

    it('should select with payload.findVersions', async () => {
      const res = await payload.findVersions({
        collection: 'versioned-posts',
        limit: 1,
        sort: '-updatedAt',
        where: { parent: { equals: postId } },
        select: {
          version: {
            text: true,
          },
        },
      })

      // findVersions doesnt transform result with afterRead hook and so doesn't strip undefined values from the object
      // undefined values are happened with drizzle adapters because of transform/read

      const doc = res.docs[0]

      expect(doc.createdAt).toBeUndefined()
      expect(doc.updatedAt).toBeUndefined()
      expect(doc.version.number).toBeUndefined()
      expect(doc.version.createdAt).toBeUndefined()
      expect(doc.version.text).toBe(post.text)
    })
  })

  describe('Local API - Globals', () => {
    let globalPost: GlobalPost
    beforeAll(async () => {
      globalPost = await payload.updateGlobal({
        slug: 'global-post',
        data: {
          number: 2,
          text: '3',
        },
      })
    })

    it('should select with find', async () => {
      const res = await payload.findGlobal({
        slug: 'global-post',
        select: {
          text: true,
        },
      })

      expect(res).toStrictEqual({
        id: globalPost.id,
        text: globalPost.text,
      })
    })

    it('should select with update', async () => {
      const res = await payload.updateGlobal({
        slug: 'global-post',
        data: {},
        select: {
          text: true,
        },
      })

      expect(res).toStrictEqual({
        id: globalPost.id,
        text: globalPost.text,
      })
    })
  })

  describe('Local API - operations', () => {
    it('should apply select with create', async () => {
      const res = await payload.create({
        collection: 'posts',
        data: {
          text: 'asd',
          number: 123,
        },
        select: {
          text: true,
        },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with updateByID', async () => {
      const post = await createPost()

      const res = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {},
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with updateBulk', async () => {
      const post = await createPost()

      const {
        docs: [res],
      } = await payload.update({
        collection: 'posts',
        where: {
          id: {
            equals: post.id,
          },
        },
        data: {},
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with deleteByID', async () => {
      const post = await createPost()

      const res = await payload.delete({
        collection: 'posts',
        id: post.id,
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with deleteBulk', async () => {
      const post = await createPost()

      const {
        docs: [res],
      } = await payload.delete({
        collection: 'posts',
        where: {
          id: {
            equals: post.id,
          },
        },
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with duplicate', async () => {
      const post = await createPost()

      const res = await payload.duplicate({
        collection: 'posts',
        id: post.id,
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })
  })

  describe('REST API - Base', () => {
    let post: Post
    let postId: number | string

    beforeEach(async () => {
      post = await createPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'posts' })
    })

    describe('Include mode', () => {
      it('should select only text', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                text: true,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          text: post.text,
          id: postId,
        })
      })

      it('should select number and text', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                number: true,
                text: true,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                group: true,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          id: postId,
          group: post.group,
        })
      })

      it('should select text field inside of group', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                group: { text: true },
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          id: postId,
          group: {
            text: post.group.text,
          },
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                text: false,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        const expected = { ...post }

        delete expected['text']

        expect(res).toMatchObject(expected)
      })

      it('should exclude number', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                number: false,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        const expected = { ...post }

        delete expected['number']

        expect(res).toMatchObject(expected)
      })

      it('should exclude number and text', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                number: false,
                text: false,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        const expected = { ...post }

        delete expected['text']
        delete expected['number']

        expect(res).toMatchObject(expected)
      })

      it('should exclude text field inside of group', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              select: {
                group: {
                  text: false,
                },
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        const expected = deepCopyObject(post)

        delete expected.group.text

        expect(res).toMatchObject(expected)
      })
    })
  })

  describe('populate / defaultPopulate', () => {
    let homePage: Page
    let aboutPage: Page
    let expectedHomePage: {
      array: [
        {
          id: string
          title: string
        },
      ]
      blocks: [
        {
          blockType: string
          id: string
          title: string
        },
      ]
      id: number | string
      slug: string
    }
    let expectedHomePageOverride: { additional: string; id: number | string }
    beforeAll(async () => {
      homePage = await payload.create({
        depth: 0,
        collection: 'pages',
        data: {
          content: [],
          slug: 'home',
          array: [
            {
              title: 'some-title',
              other: 'other',
            },
          ],
          blocks: [
            {
              blockType: 'some',
              other: 'other',
              title: 'some-title',
            },
          ],
          additional: 'additional-data',
        },
      })
      expectedHomePage = {
        id: homePage.id,
        slug: homePage.slug,
        array: [
          {
            id: homePage.array[0].id,
            title: homePage.array[0].title,
          },
        ],
        blocks: [
          {
            blockType: homePage.blocks[0].blockType,
            id: homePage.blocks[0].id,
            title: homePage.blocks[0].title,
          },
        ],
      }
      expectedHomePageOverride = { id: homePage.id, additional: homePage.additional }
      aboutPage = await payload.create({
        depth: 0,
        collection: 'pages',
        data: {
          content: [
            {
              blockType: 'introduction',
              richTextSlate: [
                {
                  type: 'relationship',
                  relationTo: 'pages',
                  value: { id: homePage.id },
                },
              ],
              richTextLexical: {
                root: {
                  children: [
                    {
                      format: '',
                      type: 'relationship',
                      version: 2,
                      relationTo: 'pages',
                      value: homePage.id,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              },
              link: {
                doc: homePage.id,
                docHasManyPoly: [
                  {
                    relationTo: 'pages',
                    value: homePage.id,
                  },
                ],
                docMany: [homePage.id],
                docPoly: {
                  relationTo: 'pages',
                  value: homePage.id,
                },
                label: 'Visit our Home Page!',
              },
              title: 'Contact Us',
            },
          ],
          slug: 'about',
        },
      })
    })

    it('local API - should populate with the defaultPopulate select shape', async () => {
      const result = await payload.findByID({ collection: 'pages', depth: 1, id: aboutPage.id })

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
            richTextSlate: [richTextSlateRel],
            richTextLexical: {
              root: {
                children: [richTextLexicalRel],
              },
            },
          },
        ],
      } = result

      expect(doc).toStrictEqual(expectedHomePage)
      expect(docMany).toStrictEqual([expectedHomePage])
      expect(docPoly).toStrictEqual({
        relationTo: 'pages',
        value: expectedHomePage,
      })
      expect(docHasManyPoly).toStrictEqual([
        {
          relationTo: 'pages',
          value: expectedHomePage,
        },
      ])
      expect(richTextLexicalRel.value).toStrictEqual(expectedHomePage)
      expect(richTextSlateRel.value).toStrictEqual(expectedHomePage)
    })

    it('rEST API - should populate with the defaultPopulate select shape', async () => {
      const restResult = await (
        await restClient.GET(`/pages/${aboutPage.id}`, { query: { depth: 1 } })
      ).json()

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
            richTextSlate: [richTextSlateRel],
            richTextLexical: {
              root: {
                children: [richTextLexicalRel],
              },
            },
          },
        ],
      } = restResult

      expect(doc).toMatchObject(expectedHomePage)
      expect(docMany).toMatchObject([expectedHomePage])
      expect(docPoly).toMatchObject({
        relationTo: 'pages',
        value: expectedHomePage,
      })
      expect(docHasManyPoly).toMatchObject([
        {
          relationTo: 'pages',
          value: expectedHomePage,
        },
      ])
      expect(richTextLexicalRel.value).toMatchObject(expectedHomePage)
      expect(richTextSlateRel.value).toMatchObject(expectedHomePage)
    })

    it('graphQL - should retrieve fields against defaultPopulate', async () => {
      const query = `query {
        Pages {
          docs { 
            id,
            content {
              ... on Introduction {
                link {
                  doc {
                    id,
                    additional,
                    slug, 
                  }
                },
                richTextLexical(depth: 1)
                richTextSlate(depth: 1)
              }
            }
          }
        }
      }`

      const {
        data: {
          Pages: {
            docs: [
              {
                content: [
                  {
                    link,
                    richTextSlate: [richTextSlateRel],
                    richTextLexical: {
                      root: {
                        children: [richTextLexicalRel],
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(link.doc).toMatchObject({
        id: homePage.id,
        additional: homePage.additional,
        slug: homePage.slug,
      })
      expect(richTextLexicalRel.value).toMatchObject(homePage)
      expect(richTextSlateRel.value).toMatchObject(homePage)
    })

    it('local API - should populate and override defaultSelect select shape from the populate arg', async () => {
      const result = await payload.findByID({
        populate: {
          pages: {
            additional: true,
          },
        },
        collection: 'pages',
        depth: 1,
        id: aboutPage.id,
      })

      const {
        docs: [resultFind],
      } = await payload.find({
        collection: 'pages',
        depth: 1,
        populate: {
          pages: {
            additional: true,
          },
        },
        where: {
          id: {
            equals: aboutPage.id,
          },
        },
      })

      expect(resultFind).toStrictEqual(result)

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
            richTextSlate: [richTextSlateRel],
            richTextLexical: {
              root: {
                children: [richTextLexicalRel],
              },
            },
          },
        ],
      } = result

      expect(doc).toStrictEqual(expectedHomePageOverride)
      expect(docMany).toStrictEqual([expectedHomePageOverride])
      expect(docPoly).toStrictEqual({
        relationTo: 'pages',
        value: expectedHomePageOverride,
      })
      expect(docHasManyPoly).toStrictEqual([
        {
          relationTo: 'pages',
          value: expectedHomePageOverride,
        },
      ])

      expect(richTextLexicalRel.value).toStrictEqual(expectedHomePageOverride)
      expect(richTextSlateRel.value).toStrictEqual(expectedHomePageOverride)
    })

    it('rEST API - should populate and override defaultSelect select shape from the populate arg', async () => {
      const result = await restClient
        .GET(`/pages/${aboutPage.id}`, {
          query: {
            populate: {
              pages: {
                additional: true,
              },
            },
            depth: 1,
          },
        })
        .then((res) => res.json())

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
            richTextSlate: [richTextSlateRel],
            richTextLexical: {
              root: {
                children: [richTextLexicalRel],
              },
            },
          },
        ],
      } = result

      expect(doc).toMatchObject(expectedHomePageOverride)
      expect(docMany).toMatchObject([expectedHomePageOverride])
      expect(docPoly).toMatchObject({
        relationTo: 'pages',
        value: expectedHomePageOverride,
      })
      expect(docHasManyPoly).toMatchObject([
        {
          relationTo: 'pages',
          value: expectedHomePageOverride,
        },
      ])

      expect(richTextLexicalRel.value).toMatchObject(expectedHomePageOverride)
      expect(richTextSlateRel.value).toMatchObject(expectedHomePageOverride)
    })
  })
})

function createPost() {
  return payload.create({
    collection: 'posts',
    depth: 0,
    data: {
      number: 1,
      text: 'text',
      select: 'a',
      selectMany: ['a'],
      group: {
        number: 1,
        text: 'text',
      },
      blocks: [
        {
          blockType: 'cta',
          ctaText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'intro',
          introText: 'intro-text',
          text: 'text',
        },
      ],
      array: [
        {
          text: 'text',
          number: 1,
        },
      ],
      tab: {
        text: 'text',
        number: 1,
      },
      unnamedTabNumber: 2,
      unnamedTabText: 'text2',
    },
  })
}

function createLocalizedPost() {
  return payload.create({
    collection: 'localized-posts',
    depth: 0,
    data: {
      number: 1,
      text: 'text',
      select: 'a',
      selectMany: ['a'],
      group: {
        number: 1,
        text: 'text',
      },
      groupSecond: {
        number: 1,
        text: 'text',
      },
      blocks: [
        {
          blockType: 'cta',
          ctaText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'intro',
          introText: 'intro-text',
          text: 'text',
        },
      ],
      blocksSecond: [
        {
          blockType: 'second',
          secondText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'first',
          firstText: 'intro-text',
          text: 'text',
        },
      ],
      array: [
        {
          text: 'text',
          number: 1,
        },
      ],
      arraySecond: [
        {
          text: 'text',
          number: 1,
        },
      ],
    },
  })
}

function createDeepPost() {
  return payload.create({
    collection: 'deep-posts',
    data: {
      arrayTop: [{ text: 'text1', arrayNested: [{ text: 'text2', number: 34 }] }],
      group: {
        array: [{ group: { number: 1, text: 'text-3' } }],
        blocks: [{ blockType: 'block', number: 3, text: 'text-4' }],
      },
    },
  })
}

function createVersionedPost() {
  return payload.create({
    collection: 'versioned-posts',
    data: {
      number: 2,
      text: 'text',
      array: [{ text: 'hello' }],
      blocks: [{ blockType: 'test', text: 'hela' }],
    },
  })
}

function createPoint() {
  return payload.create({ collection: 'points', data: { text: 'some', point: [10, 20] } })
}
