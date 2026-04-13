import type { Payload } from 'payload'

import assert from 'assert'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it, vitest } from 'vitest'

import type { Post } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

let payload: Payload

describePostgres('database - postgres logs', () => {
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

  it('ensure simple update uses optimized upsertRow with returning()', async () => {
    const doc = await payload.create({
      collection: 'simple',
      data: {
        text: 'Some title',
        number: 5,
      },
    })

    // Count every console log
    const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

    const result: any = await payload.db.updateOne({
      collection: 'simple',
      id: doc.id,
      data: {
        text: 'Updated Title',
        number: 5,
      },
    })

    expect(result.text).toEqual('Updated Title')
    expect(result.number).toEqual(5) // Ensure the update did not reset the number field

    expect(consoleCount).toHaveBeenCalledTimes(1) // Should be 1 single sql call if the optimization is used. If not, this would be 2 calls
    consoleCount.mockRestore()
  })

  it('ensure simple update of complex collection uses optimized upsertRow without returning()', async () => {
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title',
        number: 5,
      },
    })

    // Count every console log
    const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

    const result: any = await payload.db.updateOne({
      collection: 'posts',
      id: doc.id,
      data: {
        title: 'Updated Title',
        number: 5,
      },
    })

    expect(result.title).toEqual('Updated Title')
    expect(result.number).toEqual(5) // Ensure the update did not reset the number field

    expect(consoleCount).toHaveBeenCalledTimes(2) // Should be 2 sql call if the optimization is used (update + find). If not, this would be 5 calls
    consoleCount.mockRestore()
  })

  it('ensure deleteMany is done in single db query - no where query', async () => {
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title',
        number: 5,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title 2',
        number: 5,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title 2',
        number: 5,
      },
    })
    // Count every console log
    const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

    await payload.db.deleteMany({
      collection: 'posts',
      where: {},
    })

    expect(consoleCount).toHaveBeenCalledTimes(1)
    consoleCount.mockRestore()

    const allPosts = await payload.find({
      collection: 'posts',
    })

    expect(allPosts.docs).toHaveLength(0)
  })

  it('ensure deleteMany is done in single db query while respecting where query', async () => {
    const doc1 = await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title',
        number: 5,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title 2',
        number: 5,
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Some title 2',
        number: 5,
      },
    })
    // Count every console log
    const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

    await payload.db.deleteMany({
      collection: 'posts',
      where: {
        title: { equals: 'Some title 2' },
      },
    })

    expect(consoleCount).toHaveBeenCalledTimes(1)
    consoleCount.mockRestore()

    const allPosts = await payload.find({
      collection: 'posts',
    })

    expect(allPosts.docs).toHaveLength(1)
    expect(allPosts.docs[0]?.id).toEqual(doc1.id)
  })

  it('ensure array update using $push is done in single db call', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        arrayWithIDs: [
          {
            text: 'some text',
          },
        ],
        title: 'post',
      },
    })
    const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

    await payload.db.updateOne({
      data: {
        // Ensure db adapter does not automatically set updatedAt - one less db call
        updatedAt: null,
        arrayWithIDs: {
          $push: {
            text: 'some text 2',
            id: new mongoose.Types.ObjectId().toHexString(),
          },
        },
      },
      collection: 'posts',
      id: post.id,
      returning: false,
    })

    // 1 Update:
    // 1. (updatedAt for posts row.) - skipped because we explicitly set updatedAt to null
    // 2. arrayWithIDs.$push for posts row
    expect(consoleCount).toHaveBeenCalledTimes(1)
    consoleCount.mockRestore()

    const updatedPost = (await payload.db.findOne({
      collection: 'posts',
      where: { id: { equals: post.id } },
    })) as unknown as Post

    expect(updatedPost.title).toBe('post')
    expect(updatedPost.arrayWithIDs).toHaveLength(2)
    expect(updatedPost.arrayWithIDs?.[0]?.text).toBe('some text')
    expect(updatedPost.arrayWithIDs?.[1]?.text).toBe('some text 2')
  })
})
