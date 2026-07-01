import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { deepCopyObject } from 'payload'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
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

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'

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
    assert(initialized.payload)
    assert(initialized.restClient)
    ;({ payload, restClient } = initialized)
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('Local API - Base', () => {
    let post: Post
    let postId: number | string

    let point: Point
    let pointId: number | string

    beforeAll(async () => {
      post = await createPost()
      postId = post.id

      point = await createPoint()
      pointId = point.id
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('customID - should select only id as default', async () => {
        const { id } = await createCustomID()

        const res = await payload.findByID({
          id,
          collection: 'custom-ids',
          depth: 0,
          select: {},
        })

        expect(res).toStrictEqual({
          id,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            number: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('customID - should select only text', async () => {
        const { id, text } = await createCustomID()

        const res = await payload.findByID({
          id,
          collection: 'custom-ids',
          depth: 0,
          select: {
            text: true,
          },
        })

        expect(res).toStrictEqual({
          id,
          text,
        })
      })

      it('should select only select', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
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

      it('should select relationships', async () => {
        const res_1 = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            hasManyUpload: true,
          },
        })

        expect(res_1).toStrictEqual({
          id: postId,
          hasManyUpload: post.hasManyUpload,
        })

        const res_2 = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            hasOne: true,
          },
        })

        expect(res_2).toStrictEqual({
          id: postId,
          hasOne: post.hasOne,
        })

        const res_3 = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            hasManyPoly: true,
          },
        })

        expect(res_3).toStrictEqual({
          id: postId,
          hasManyPoly: post.hasManyPoly,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group?.text,
          },
        })
      })

      it('should select all the fields inside of named tab', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            tab: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          tab: {
            text: post.tab?.text,
          },
        })
      })

      it('should select text field inside of unnamed tab', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array?.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array?.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) => ({ id: block.id, blockType: block.blockType })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) =>
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) =>
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
          id: pointId,
          collection: 'points',
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']

        expect(res).toStrictEqual(expected)
      })

      it('customID - should exclude text', async () => {
        const { id, createdAt, updatedAt } = await createCustomID()

        const res = await payload.findByID({
          id,
          collection: 'custom-ids',
          depth: 0,
          select: {
            text: false,
          },
        })

        expect(res).toStrictEqual({
          id,
          createdAt,
          updatedAt,
        })
      })

      it('should exclude number', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
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

      it('should exclude relationships', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            hasMany: false,
            hasManyPoly: false,
            hasOne: false,
            hasOnePoly: false,
          },
        })

        const expected = { ...post }

        delete expected['hasOne']
        delete expected['hasMany']
        delete expected['hasManyPoly']
        delete expected['hasOnePoly']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude group', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group?.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array?.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
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
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks?.map((block) =>
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'posts',
          depth: 0,
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        const expectedPost = deepCopyObject(post)
        expect(res).toStrictEqual({
          ...expectedPost,
          blocks: expectedPost.blocks?.map((block) => {
            if ('ctaText' in block) {
              delete block['ctaText']
            }

            return block
          }),
        })
      })

      it('should exclude a point field', async () => {
        if (payload.db.name === 'sqlite') {
          return
        }
        const res = await payload.findByID({
          id: pointId,
          collection: 'points',
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

    beforeAll(async () => {
      post = await createLocalizedPost()
      postId = post.id
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group?.text,
          },
        })
      })

      it('should select localized text field inside of group', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            groupSecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          groupSecond: {
            text: post.groupSecond?.text,
          },
        })
      })

      it('should select id as default from array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array?.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array?.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select localized text field inside of array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            arraySecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          arraySecond: post.arraySecond?.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) => ({ id: block.id, blockType: block.blockType })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) =>
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
          id: postId,
          collection: 'localized-posts',
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks?.map((block) =>
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
          id: postId,
          collection: 'localized-posts',
          select: {
            blocksSecond: {
              second: { text: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond?.map((block) =>
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
          id: postId,
          collection: 'localized-posts',
          select: {
            blocksSecond: {
              first: { firstText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond?.map((block) =>
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group?.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude localized text field inside of group', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            groupSecond: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.groupSecond?.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array?.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude localized text field inside of array', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            arraySecond: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          arraySecond: post.arraySecond?.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
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
          id: postId,
          collection: 'localized-posts',
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks?.map((block) =>
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        const expectedPost = deepCopyObject(post)
        expect(res).toStrictEqual({
          ...expectedPost,
          blocks: expectedPost.blocks?.map((block) => {
            if ('ctaText' in block) {
              delete block['ctaText']
            }

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 1', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            blocksSecond: {
              second: { text: false },
            },
          },
        })

        const expectedPost = deepCopyObject(post)
        expect(res).toStrictEqual({
          ...expectedPost,
          blocksSecond: expectedPost.blocksSecond?.map((block) => {
            if (block.blockType === 'second') {
              delete block['text']
            }

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 2', async () => {
        const res = await payload.findByID({
          id: postId,
          collection: 'localized-posts',
          select: {
            blocksSecond: {
              first: { firstText: false },
            },
          },
        })

        const expectedPost = deepCopyObject(post)
        expect(res).toStrictEqual({
          ...expectedPost,
          blocksSecond: expectedPost.blocksSecond?.map((block) => {
            if ('firstText' in block) {
              delete block['firstText']
            }

            return block
          }),
        })
      })
    })
  })

  describe('Local API - Deep Fields', () => {
    let post: DeepPost
    let postId: number | string

    beforeAll(async () => {
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
          array: post.group?.array?.map((item) => ({
            id: item.id,
            group: {
              text: item.group?.text,
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
          array: post.group?.array?.map((item) => ({
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
          blocks: post.group?.blocks?.map((item) => ({
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
        arrayTop: post.arrayTop?.map((item) => ({
          id: item.id,
          arrayNested: item.arrayNested?.map((item) => ({
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

    beforeAll(async () => {
      post = await createVersionedPost()
      postId = post.id
    })

    it('should select only id as default', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'versioned-posts',
        draft: true,
        select: {},
      })

      expect(res).toStrictEqual({
        id: postId,
      })
    })

    it('should select only number', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'versioned-posts',
        draft: true,
        select: {
          number: true,
        },
      })

      expect(res).toStrictEqual({
        id: postId,
        number: post.number,
      })
    })

    it('should exclude only number', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'versioned-posts',
        draft: true,
        select: {
          number: false,
        },
      })

      const expected = { ...post }

      delete expected['number']
      expect(res).toStrictEqual(expected)
    })

    it('should select number and text', async () => {
      const res = await payload.findByID({
        id: postId,
        collection: 'versioned-posts',
        draft: true,
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

    it('payload.find should select number and text', async () => {
      const res = await payload.find({
        collection: 'versioned-posts',
        draft: true,
        select: {
          number: true,
          text: true,
        },
        where: {
          id: {
            equals: postId,
          },
        },
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
        draft: true,
        select: {
          array: {},
        },
        where: {
          id: {
            equals: postId,
          },
        },
      })

      expect(res.docs[0]).toStrictEqual({
        id: postId,
        array: post.array?.map((each) => ({ id: each.id })),
      })
    })

    it('should select base id field inside of blocks', async () => {
      const res = await payload.find({
        collection: 'versioned-posts',
        draft: true,
        select: {
          blocks: {},
        },
        where: {
          id: {
            equals: postId,
          },
        },
      })

      expect(res.docs[0]).toStrictEqual({
        id: postId,
        blocks: post.blocks?.map((each) => ({ id: each.id, blockType: each.blockType })),
      })
    })

    it('should select with payload.findVersions', async () => {
      const res = await payload.findVersions({
        collection: 'versioned-posts',
        limit: 1,
        select: {
          version: {
            text: true,
          },
        },
        sort: '-updatedAt',
        where: { parent: { equals: postId } },
      })

      // findVersions doesnt transform result with afterRead hook and so doesn't strip undefined values from the object
      // undefined values are happened with drizzle adapters because of transform/read

      const doc = res.docs[0]

      assert(doc)

      expect(doc.createdAt).toBeUndefined()
      expect(doc.updatedAt).toBeUndefined()
      expect(doc.version.number).toBeUndefined()
      expect(doc.version.createdAt).toBeUndefined()
      expect(doc.version.text).toBe(post.text)
    })

    it('should return a latest version with findByID and draft: true', async () => {
      const doc = await payload.create({
        collection: 'versioned-posts',
        data: { _status: 'draft', text: 'draft-post' },
        draft: true,
      })

      const res = await payload.findByID({
        id: doc.id,
        collection: 'versioned-posts',
        draft: true,
        select: { text: true },
      })
      expect(res.text).toBe('draft-post')
      await payload.update({
        id: doc.id,
        collection: 'versioned-posts',
        data: { _status: 'published', text: 'published' },
      })

      const res_2 = await payload.findByID({
        id: doc.id,
        collection: 'versioned-posts',
        draft: true,
        select: { text: true },
      })

      expect(res_2).toStrictEqual({
        id: res_2.id,
        text: 'published',
      })
    })

    it('should create versions with complete data when updating with select', async () => {
      // First, update the post with select to only return the id field
      const updatedPost = await payload.update({
        id: postId,
        collection: 'versioned-posts',
        data: {
          number: 999,
          text: 'updated text',
        },
        select: {},
      })

      // The update operation should only return the selected field
      expect(updatedPost).toStrictEqual({
        id: postId,
      })

      // However, the created version should contain the complete document
      const versions = await payload.findVersions({
        collection: 'versioned-posts',
        limit: 1,
        sort: '-updatedAt',
        where: { parent: { equals: postId } },
      })

      const latestVersion = versions.docs[0]
      assert(latestVersion)

      // The version should have complete data, not just the selected fields
      expect(latestVersion.version.text).toBe('updated text')
      expect(latestVersion.version.number).toBe(999)
      expect(latestVersion.version.array).toEqual(post.array)
      expect(latestVersion.version.blocks).toEqual(post.blocks)
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
          number: 123,
          text: 'asd',
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
        id: post.id,
        collection: 'posts',
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

      const res = await payload.update({
        collection: 'posts',
        data: {},
        select: { text: true },
        where: {
          id: {
            equals: post.id,
          },
        },
      })

      assert(res.docs[0])

      expect(res.docs[0]).toStrictEqual({
        id: res.docs[0].id,
        text: res.docs[0].text,
      })
    })

    it('should apply select with deleteByID', async () => {
      const post = await createPost()

      const res = await payload.delete({
        id: post.id,
        collection: 'posts',
        select: { text: true },
      })

      expect(res).toStrictEqual({
        id: res.id,
        text: res.text,
      })
    })

    it('should apply select with deleteBulk', async () => {
      const post = await createPost()

      const res = await payload.delete({
        collection: 'posts',
        select: { text: true },
        where: {
          id: {
            equals: post.id,
          },
        },
      })

      assert(res.docs[0])

      expect(res.docs[0]).toStrictEqual({
        id: res.docs[0].id,
        text: res.docs[0].text,
      })
    })

    it('should apply select with duplicate', async () => {
      const post = await createPost()

      const res = await payload.duplicate({
        id: post.id,
        collection: 'posts',
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

    beforeAll(async () => {
      post = await createPost()
      postId = post.id
    })

    describe('Include mode', () => {
      it('should select only text', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              depth: 0,
              select: {
                text: true,
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          id: postId,
          text: post.text,
        })
      })

      it('should select number and text', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              depth: 0,
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
              depth: 0,
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
              depth: 0,
              select: {
                group: { text: true },
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        expect(res).toMatchObject({
          id: postId,
          group: {
            text: post.group?.text,
          },
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await restClient
          .GET(`/posts/${postId}`, {
            query: {
              depth: 0,
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
              depth: 0,
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
              depth: 0,
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
              depth: 0,
              select: {
                group: {
                  text: false,
                },
              } satisfies Config['collectionsSelect']['posts'],
            },
          })
          .then((res) => res.json())

        const expected = deepCopyObject(post)

        delete expected.group?.text

        expect(res).toMatchObject(expected)
      })
    })
  })

  describe('REST API - Logged in', () => {
    let token: string | undefined

    beforeAll(async () => {
      const response = await restClient.POST(`/users/login`, {
        body: JSON.stringify({
          email: devUser.email,
          password: devUser.password,
        }),
      })

      const data = await response.json()

      token = data.token
    })

    it('should return only select fields in user from /me', async () => {
      const response = await restClient.GET(`/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
        query: {
          depth: 0,
          select: {
            name: true,
          } satisfies Config['collectionsSelect']['users'],
        },
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.name).toBeDefined()
      expect(data.user.email).not.toBeDefined()
      expect(data.user.number).not.toBeDefined()
    })

    it('should return all fields by default in user from /me', async () => {
      const response = await restClient.GET(`/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
        query: {
          depth: 0,
        },
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.email).toBeDefined()
      expect(data.user.name).toBeDefined()
      expect(data.user.number).toBeDefined()
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
        collection: 'pages',
        data: {
          slug: 'home',
          additional: 'additional-data',
          array: [
            {
              other: 'other',
              title: 'some-title',
            },
          ],
          blocks: [
            {
              blockType: 'some',
              other: 'other',
              title: 'some-title',
            },
          ],
          content: [],
        },
        depth: 0,
      })

      expectedHomePage = {
        id: homePage.id,
        slug: homePage.slug,
        array: [
          {
            id: homePage.array![0]!.id!,
            title: homePage.array![0]!.title!,
          },
        ],
        blocks: [
          {
            id: homePage.blocks![0]!.id!,
            blockType: homePage.blocks![0]!.blockType,
            title: homePage.blocks![0]!.title!,
          },
        ],
      }
      expectedHomePageOverride = { id: homePage.id, additional: homePage.additional! }
      aboutPage = await payload.create({
        collection: 'pages',
        data: {
          slug: 'about',
          content: [
            {
              blockType: 'introduction',
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
              richTextLexical: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'relationship',
                      format: '',
                      relationTo: 'pages',
                      value: homePage.id,
                      version: 2,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              },
              title: 'Contact Us',
            },
          ],
        },
        depth: 0,
      })
    })

    it('local API - should populate with the defaultPopulate select shape', async () => {
      const result = await payload.findByID({ id: aboutPage.id, collection: 'pages', depth: 1 })

      const block = result.content![0]!

      const { doc, docHasManyPoly, docMany, docPoly } = block.link
      const richTextLexicalRel = block.richTextLexical!.root.children[0]!

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
    })

    it('rEST API - should populate with the defaultPopulate select shape', async () => {
      const restResult = await (
        await restClient.GET(`/pages/${aboutPage.id}`, { query: { depth: 1 } })
      ).json()

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
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
        slug: homePage.slug,
        additional: homePage.additional,
      })
      expect(richTextLexicalRel.value).toMatchObject(homePage)
    })

    it('graphQL - should return relationship fields when using select flag', async () => {
      // Create a related document first
      const rel = await payload.create({ collection: 'rels', data: { text: 'graphql-rel-test' } })

      // Create a post with the relationship
      const testPost = await payload.create({
        collection: 'posts',
        data: {
          hasMany: [rel.id],
          hasOne: rel.id,
          number: 42,
          text: 'graphql-select-test',
        },
        depth: 0,
      })

      const testPostId = typeof testPost.id === 'string' ? `"${testPost.id}"` : testPost.id

      // Query with select: true to enable the GraphQL select optimization
      // This is the scenario from issue #14467 where relationship fields were returned as empty arrays
      const query = `query {
        Posts(where: { id: { equals: ${testPostId} } }, select: true) {
          docs {
            id
            text
            hasOne {
              id
              text
            }
            hasMany {
              id
              text
            }
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      const doc = response.data?.Posts?.docs?.[0]

      expect(doc).toBeDefined()
      expect(doc.id).toBe(testPost.id)
      expect(doc.text).toBe('graphql-select-test')

      expect(doc.hasOne).toBeDefined()
      expect(doc.hasOne.id).toBe(rel.id)
      expect(doc.hasOne.text).toBe('graphql-rel-test')

      expect(doc.hasMany).toBeDefined()
      expect(doc.hasMany).toHaveLength(1)
      expect(doc.hasMany[0].id).toBe(rel.id)
      expect(doc.hasMany[0].text).toBe('graphql-rel-test')

      // Cleanup
      await payload.delete({ id: testPost.id, collection: 'posts' })
      await payload.delete({ id: rel.id, collection: 'rels' })
    })

    it('graphQL - should return polymorphic relationship fields when using select flag', async () => {
      // Create a related document
      const rel = await payload.create({ collection: 'rels', data: { text: 'graphql-poly-test' } })

      // Create a post with polymorphic relationships
      const testPost = await payload.create({
        collection: 'posts',
        data: {
          hasManyPoly: [{ relationTo: 'rels', value: rel.id }],
          hasOnePoly: { relationTo: 'rels', value: rel.id },
          number: 43,
          text: 'graphql-poly-select-test',
        },
        depth: 0,
      })

      const testPostId = typeof testPost.id === 'string' ? `"${testPost.id}"` : testPost.id

      // Query with select: true
      const query = `query {
        Posts(where: { id: { equals: ${testPostId} } }, select: true) {
          docs {
            id
            text
            hasOnePoly {
              relationTo
              value {
                ...on Rel {
                  id
                  text
                }
              }
            }
            hasManyPoly {
              relationTo
              value {
                ...on Rel {
                  id
                  text
                }
              }
            }
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      const doc = response.data?.Posts?.docs?.[0]

      expect(doc).toBeDefined()
      expect(doc.id).toBe(testPost.id)

      // Polymorphic hasOne
      expect(doc.hasOnePoly).toBeDefined()
      expect(doc.hasOnePoly.relationTo).toBe('rels')
      expect(doc.hasOnePoly.value.id).toBe(rel.id)
      expect(doc.hasOnePoly.value.text).toBe('graphql-poly-test')

      // Polymorphic hasMany
      expect(doc.hasManyPoly).toBeDefined()
      expect(doc.hasManyPoly).toHaveLength(1)
      expect(doc.hasManyPoly[0].relationTo).toBe('rels')
      expect(doc.hasManyPoly[0].value.id).toBe(rel.id)
      expect(doc.hasManyPoly[0].value.text).toBe('graphql-poly-test')

      // Cleanup
      await payload.delete({ id: testPost.id, collection: 'posts' })
      await payload.delete({ id: rel.id, collection: 'rels' })
    })

    it('local API - should populate and override defaultSelect select shape from the populate arg', async () => {
      const result = await payload.findByID({
        id: aboutPage.id,
        collection: 'pages',
        depth: 1,
        populate: {
          pages: {
            additional: true,
          },
        },
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

      const block = result.content![0]!

      const { doc, docHasManyPoly, docMany, docPoly } = block.link
      const richTextLexicalRel = block.richTextLexical!.root.children[0]!

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
    })

    it('rEST API - should populate and override defaultSelect select shape from the populate arg', async () => {
      const result = await restClient
        .GET(`/pages/${aboutPage.id}`, {
          query: {
            depth: 1,
            populate: {
              pages: {
                additional: true,
              },
            },
          },
        })
        .then((res) => res.json())

      const {
        content: [
          {
            link: { doc, docHasManyPoly, docMany, docPoly },
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
    })

    it('should apply populate on depth 2', async () => {
      const page_1 = await payload.create({
        collection: 'pages',
        data: { slug: 'page-1', blocks: [{ blockType: 'some' }], relatedPage: null },
      })
      const page_2 = await payload.create({
        collection: 'pages',
        data: { slug: 'page-2', relatedPage: page_1.id },
      })
      const page_3 = await payload.create({
        collection: 'pages',
        data: { slug: 'page-3', relatedPage: page_2.id },
      })
      const result = await payload.findByID({
        id: page_3.id,
        collection: 'pages',
        depth: 3,
        populate: { pages: { slug: true, relatedPage: true } },
      })

      const relatedPage = result.relatedPage as Page

      expect(relatedPage.id).toBe(page_2.id)
      expect(relatedPage.relatedPage).toStrictEqual({
        id: page_1.id,
        slug: page_1.slug,
        relatedPage: null,
      })
    })
  })

  it('should auto-select field2 when caller selects field1 on collections', async () => {
    const { id } = await payload.create({
      collection: 'force-select',
      data: { field1: 'one', field2: 'two', text: 'control' },
    })

    // Caller selects `field1` → hook auto-selects `field2`.
    const augmented = await payload.findByID({
      id,
      collection: 'force-select',
      select: { field1: true },
    })

    expect(augmented).toStrictEqual({
      id,
      field1: 'one',
      field2: 'two',
    })

    // Caller selects `text` (not field1) → hook returns args unchanged, `field2` excluded.
    const notAugmented = await payload.findByID({
      id,
      collection: 'force-select',
      select: { text: true },
    })

    expect(notAugmented).toStrictEqual({
      id,
      text: 'control',
    })

    await payload.delete({ id, collection: 'force-select' })
  })

  it('should auto-select field2 when caller selects field1 on globals', async () => {
    const { id } = await payload.updateGlobal({
      slug: 'force-select-global',
      data: { field1: 'one', field2: 'two', text: 'control' },
    })

    const augmented = await payload.findGlobal({
      slug: 'force-select-global',
      select: { field1: true },
    })

    expect(augmented).toStrictEqual({
      id,
      field1: 'one',
      field2: 'two',
    })
  })

  it('should pass req + select context to the select function', async () => {
    const calls: Array<{ operation: string; selectKeys?: string[]; userEmail?: string }> = []

    const collection = payload.config.collections.find((c) => c.slug === 'force-select')!
    const originalSelect = collection.select

    collection.select = (args) => {
      calls.push({
        operation: args.operation,
        selectKeys: args.select ? Object.keys(args.select) : undefined,
        userEmail: args.req?.user?.email,
      })
      return undefined
    }

    try {
      const created = await payload.create({
        collection: 'force-select',
        data: { field1: 'a', field2: 'b' },
        select: { field1: true },
      })

      await payload.findByID({
        id: created.id,
        collection: 'force-select',
        select: { field1: true },
      })

      await payload.delete({ id: created.id, collection: 'force-select' })

      const operations = calls.map((c) => c.operation)
      expect(operations).toContain('create')
      expect(operations).toContain('read')
      expect(operations).toContain('delete')

      const readCall = calls.find((c) => c.operation === 'read')
      expect(readCall?.selectKeys).toEqual(['field1'])
    } finally {
      collection.select = originalSelect
    }
  })

  it('should properly return relationships when using select on block with depth 0', async () => {
    const rel_1 = await payload.create({ collection: 'rels', data: { text: 'rel-1' } })
    const doc = await payload.create({
      collection: 'relationships-blocks',
      data: {
        blocks: [
          {
            blockType: 'block',
            hasMany: [rel_1],
            hasOne: rel_1,
          },
        ],
      },
    })
    const result = await payload.findByID({
      id: doc.id,
      collection: 'relationships-blocks',
      depth: 0,
      select: { blocks: true },
    })

    expect(result.blocks[0]?.hasOne).toBe(rel_1.id)
    expect(result.blocks[0]?.hasMany).toEqual([rel_1.id])
  })

  it('should populate relationships when using select on block', async () => {
    const rel_1 = await payload.create({ collection: 'rels', data: { text: 'rel-1' } })
    const doc = await payload.create({
      collection: 'relationships-blocks',
      data: {
        blocks: [
          {
            blockType: 'block',
            hasMany: [rel_1],
            hasOne: rel_1,
          },
        ],
      },
    })

    const result = await payload.findByID({
      id: doc.id,
      collection: 'relationships-blocks',
      depth: 1,
      select: { blocks: true },
    })

    expect(result.blocks[0]?.hasOne.text).toBe('rel-1')
    expect(result.blocks[0]?.hasMany[0].text).toBe('rel-1')
  })
})

async function createPost() {
  const upload = await payload.create({
    collection: 'upload',
    data: {},
    filePath: path.resolve(dirname, 'image.jpg'),
  })

  const relation = await payload.create({
    collection: 'rels',
    data: {},
    depth: 0,
  })

  return payload.create({
    collection: 'posts',
    data: {
      array: [
        {
          number: 1,
          text: 'text',
        },
      ],
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
      group: {
        number: 1,
        text: 'text',
      },
      hasMany: [relation],
      hasManyPoly: [{ relationTo: 'rels', value: relation }],
      hasManyUpload: [upload],
      hasOne: relation,
      hasOnePoly: { relationTo: 'rels', value: relation },
      number: 1,
      select: 'a',
      selectMany: ['a'],
      tab: {
        number: 1,
        text: 'text',
      },
      text: 'text',
      unnamedTabNumber: 2,
      unnamedTabText: 'text2',
    },
    depth: 0,
  })
}

function createLocalizedPost() {
  return payload.create({
    collection: 'localized-posts',
    data: {
      array: [
        {
          number: 1,
          text: 'text',
        },
      ],
      arraySecond: [
        {
          number: 1,
          text: 'text',
        },
      ],
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
      group: {
        number: 1,
        text: 'text',
      },
      groupSecond: {
        number: 1,
        text: 'text',
      },
      number: 1,
      select: 'a',
      selectMany: ['a'],
      text: 'text',
    },
    depth: 0,
  })
}

function createDeepPost() {
  return payload.create({
    collection: 'deep-posts',
    data: {
      arrayTop: [{ arrayNested: [{ number: 34, text: 'text2' }], text: 'text1' }],
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
      array: [{ text: 'hello' }],
      blocks: [{ blockType: 'test', text: 'hela' }],
      number: 2,
      text: 'text',
    },
  })
}

function createPoint() {
  return payload.create({ collection: 'points', data: { point: [10, 20], text: 'some' } })
}

let id = 1

function createCustomID() {
  return payload.create({ collection: 'custom-ids', data: { id: id++, text: randomUUID() } })
}
