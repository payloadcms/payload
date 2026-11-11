/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import type { PayloadRequest } from 'payload'

import { initTransaction, killTransaction, ValidationError } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { nestedSlug } from './shared.js'

type NestedDocument = {
  _branch?: string
  _branchDocID?: number | string
  id: number | string
  items?: { id?: number | string; label?: string; note?: string }[]
  layout?: { blockType?: string; heading?: string; id?: number | string }[]
  title?: string
}

test.suite('Database copy', { config: './config.ts' }, () => {
  test('should copy isolated nested rows and replace supplied field values', async ({
    payload,
  }) => {
    const source = (await payload.create({
      collection: nestedSlug,
      data: {
        items: [
          { label: 'first source item', note: 'first source note' },
          { label: 'second source item', note: 'second source note' },
        ],
        layout: [{ blockType: 'hero', heading: 'source heading' }],
        title: 'source title',
      },
      overrideAccess: true,
    })) as NestedDocument
    const req = { payload } as PayloadRequest

    const copied = (await payload.db.copy({
      collection: nestedSlug,
      data: {
        _branch: 'copy-test',
        _branchDocID: source.id,
        items: [{ label: 'replacement item' }],
        title: 'replacement title',
      },
      req,
      where: {
        and: [{ _branch: { equals: 'main' } }, { id: { equals: source.id } }],
      },
    })) as NestedDocument

    expect(copied.id).not.toBe(source.id)
    expect(copied._branch).toBe('copy-test')
    expect(copied._branchDocID).toBe(source.id)
    expect(copied.title).toBe('replacement title')
    expect(copied.items).toHaveLength(1)
    expect(copied.items?.[0]?.label).toBe('replacement item')
    expect(copied.items?.[0]?.id).not.toBe(source.items?.[0]?.id)
    expect(copied.layout?.[0]?.heading).toBe('source heading')
    expect(copied.layout?.[0]?.id).not.toBe(source.layout?.[0]?.id)

    await payload.db.updateOne({
      id: copied.id,
      collection: nestedSlug,
      data: { items: [{ id: copied.items?.[0]?.id, label: 'changed only on copy' }] },
      req,
    })

    const sourceAfterCopyUpdate = (await payload.db.findOne({
      branch: false,
      collection: nestedSlug,
      req,
      where: { id: { equals: source.id } },
    })) as NestedDocument

    expect(sourceAfterCopyUpdate.items?.map(({ label }) => label)).toEqual([
      'first source item',
      'second source item',
    ])
  })

  test('should reject a missing source on the explicit source branch', async ({ payload }) => {
    const source = await payload.create({
      collection: nestedSlug,
      data: { title: 'main source' },
      overrideAccess: true,
    })

    await expect(
      payload.db.copy({
        collection: nestedSlug,
        data: {
          _branch: 'copy-test',
          _branchDocID: source.id,
        },
        req: { payload },
        where: {
          and: [{ _branch: { equals: 'missing-branch' } }, { id: { equals: source.id } }],
        },
      }),
    ).rejects.toMatchObject({ name: 'NotFound' })
  })

  test('should reject a duplicate destination', async ({ payload }) => {
    const source = await payload.create({
      collection: nestedSlug,
      data: { title: 'duplicate source' },
      overrideAccess: true,
    })
    const copyArgs = {
      collection: nestedSlug,
      data: {
        _branch: 'copy-test',
        _branchDocID: source.id,
      },
      req: { payload },
      where: {
        and: [{ _branch: { equals: 'main' } }, { id: { equals: source.id } }],
      },
    } as const

    await payload.db.copy(copyArgs)

    await expect(payload.db.copy(copyArgs)).rejects.toBeInstanceOf(ValidationError)
  })

  test('should select a stored branch source using the supplied where query', async ({
    payload,
  }) => {
    const source = await payload.create({
      collection: nestedSlug,
      data: { title: 'main source' },
      overrideAccess: true,
    })
    const req = { payload } as PayloadRequest
    const branchSource = await payload.db.create({
      collection: nestedSlug,
      data: {
        _branch: 'source-branch',
        _branchDocID: source.id,
        title: 'source branch value',
      },
      req,
    })

    const copied = (await payload.db.copy({
      collection: nestedSlug,
      data: {
        _branch: 'destination-branch',
        _branchDocID: source.id,
      },
      req,
      where: { id: { equals: branchSource.id } },
    })) as NestedDocument

    expect(copied._branch).toBe('destination-branch')
    expect(copied._branchDocID).toBe(source.id)
    expect(copied.title).toBe('source branch value')
  })

  test.options(
    'should leave rollback to the caller transaction',
    { db: (adapter) => adapter === 'mongodb' || adapter === 'postgres' },
    async ({ payload }) => {
      const source = await payload.create({
        collection: nestedSlug,
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
          collection: nestedSlug,
          data: {
            _branch: 'transaction-copy',
            _branchDocID: source.id,
          },
          req,
          where: {
            and: [{ _branch: { equals: 'main' } }, { id: { equals: source.id } }],
          },
        })

        copiedID = copied.id
        expect(req.transactionID).toBe(callerTransactionID)
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }

      const copyAfterRollback = await payload.db.findOne({
        branch: false,
        collection: nestedSlug,
        where: { id: { equals: copiedID } },
      })

      expect(copyAfterRollback).toBeNull()
    },
  )
})
