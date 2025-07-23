import type { Payload } from 'payload'

/* eslint-disable jest/require-top-level-describe */
import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

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
    const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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
    const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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
    const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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
    const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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
    expect(allPosts.docs[0].id).toEqual(doc1.id)
  })
})
