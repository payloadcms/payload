/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import type { PayloadRequest } from 'payload'

import { initTransaction, killTransaction } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { customIDsSlug, postsSlug } from './shared.js'

type CopyTestPost = {
  arrayWithIDs?: { id?: string; text?: string }[]
  blocksWithIDs?: { blockType: string; id?: string; text?: string }[]
  id: number | string
  title: string
}

test.suite('Database copy', { config: './config.ts' }, () => {
  test('should copy stored data with overrides and new row IDs', async ({ payload }) => {
    const source = (await payload.create({
      collection: postsSlug,
      data: {
        arrayWithIDs: [{ text: 'source array row' }],
        blocksWithIDs: [{ blockType: 'block-first', text: 'source block row' }],
        title: 'source title',
      },
      overrideAccess: true,
    })) as CopyTestPost

    const copied = (await payload.db.copy({
      collection: postsSlug,
      data: { title: 'copied title' },
      req: { payload },
      where: { id: { equals: source.id } },
    })) as CopyTestPost

    expect(copied.id).not.toBe(source.id)
    expect(copied.title).toBe('copied title')
    expect(copied.arrayWithIDs?.[0]?.text).toBe('source array row')
    expect(copied.arrayWithIDs?.[0]?.id).not.toBe(source.arrayWithIDs?.[0]?.id)
    expect(copied.blocksWithIDs?.[0]?.text).toBe('source block row')
    expect(copied.blocksWithIDs?.[0]?.id).not.toBe(source.blocksWithIDs?.[0]?.id)
  })

  test('should reject a missing source document', async ({ payload }) => {
    await expect(
      payload.db.copy({
        collection: postsSlug,
        req: { payload },
        where: { id: { equals: 'missing-document' } },
      }),
    ).rejects.toMatchObject({ name: 'NotFound' })
  })

  test('should require a destination ID for a custom-ID collection', async ({ payload }) => {
    const source = await payload.create({
      collection: customIDsSlug,
      data: { title: 'custom ID source' },
      overrideAccess: true,
    })

    await expect(
      payload.db.copy({
        collection: customIDsSlug,
        req: { payload },
        where: { id: { equals: source.id } },
      }),
    ).rejects.toThrow('requires data.id')
  })

  test('should copy a custom-ID document when given a destination ID', async ({ payload }) => {
    const source = await payload.create({
      collection: customIDsSlug,
      data: { title: 'custom ID source' },
      overrideAccess: true,
    })

    const copied = await payload.db.copy({
      collection: customIDsSlug,
      data: {
        id: 'copied-custom-id',
        title: 'custom ID copy',
      },
      req: { payload },
      where: { id: { equals: source.id } },
    })

    expect(copied.id).toBe('copied-custom-id')
    expect(copied.title).toBe('custom ID copy')
  })

  test.options(
    'should leave rollback to the caller transaction',
    { db: (adapter) => adapter === 'mongodb' || adapter === 'postgres' },
    async ({ payload }) => {
      const source = await payload.create({
        collection: postsSlug,
        data: { title: 'transaction source' },
        overrideAccess: true,
      })
      const req = { payload } as PayloadRequest
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID
      let copiedID: number | string | undefined

      expect(didStartTransaction).toBe(true)

      try {
        const copied = await payload.db.copy({
          collection: postsSlug,
          req,
          where: { id: { equals: source.id } },
        })

        copiedID = copied.id
        expect(req.transactionID).toBe(callerTransactionID)
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }

      const copyAfterRollback = await payload.db.findOne({
        collection: postsSlug,
        where: { id: { equals: copiedID } },
      })

      expect(copyAfterRollback).toBeNull()
    },
  )
})
