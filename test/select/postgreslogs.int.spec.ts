/* eslint-disable jest/require-top-level-describe */
import type { Payload } from 'payload'

import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'

import type { Point, Post } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE === 'postgres' ? describe : describe.skip

describePostgres('Select - with postgres logs', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      'config.postgreslogs.ts',
    )
    assert(initialized.payload)
    assert(initialized.restClient)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    await payload.destroy()
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

    describe('Local API - operations', () => {
      it('ensure optimized db update is still used when using select', async () => {
        const post = await createPost()

        // Count every console log
        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

        const res = removeEmptyAndUndefined(
          (await payload.db.updateOne({
            collection: 'posts',
            id: post.id,
            data: {
              text: 'new text',
            },
            select: { text: true, number: true },
          })) as any,
        )

        expect(consoleCount).toHaveBeenCalledTimes(1) // Should be 1 single sql call if the optimization is used. If not, this would be 2 calls
        consoleCount.mockRestore()

        expect(res.number).toEqual(1)
        expect(res.text).toEqual('new text')
        expect(res.id).toEqual(post.id)
        expect(Object.keys(res)).toHaveLength(3)
      })
    })
  })
})

function removeEmptyAndUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map(removeEmptyAndUndefined)
      .filter(
        (item) =>
          item !== undefined && !(typeof item === 'object' && Object.keys(item).length === 0),
      )

    return cleanedArray.length > 0 ? cleanedArray : undefined
  }

  if (obj !== null && typeof obj === 'object') {
    const cleanedEntries = Object.entries(obj)
      .map(([key, value]) => [key, removeEmptyAndUndefined(value)])
      .filter(
        ([, value]) =>
          value !== undefined &&
          !(
            typeof value === 'object' &&
            (Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0)
          ),
      )

    return cleanedEntries.length > 0 ? Object.fromEntries(cleanedEntries) : undefined
  }

  return obj
}
async function createPost() {
  const upload = await payload.create({
    collection: 'upload',
    data: {},
    filePath: path.resolve(dirname, 'image.jpg'),
  })

  const relation = await payload.create({
    depth: 0,
    collection: 'rels',
    data: {},
  })

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
      hasMany: [relation],
      hasManyUpload: [upload],
      hasOne: relation,
      hasManyPoly: [{ relationTo: 'rels', value: relation }],
      hasOnePoly: { relationTo: 'rels', value: relation },
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

function createPoint() {
  return payload.create({ collection: 'points', data: { text: 'some', point: [10, 20] } })
}
