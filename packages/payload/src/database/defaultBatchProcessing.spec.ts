import type { BaseDatabaseAdapter, Document, PayloadRequest } from '../index.js'

import { describe, expect, test } from 'vitest'

import { createDatabaseAdapter } from './createDatabaseAdapter.js'
import { defaultBatchProcessing } from './defaultBatchProcessing.js'

type TestAdapter = Pick<BaseDatabaseAdapter, 'create' | 'deleteOne' | 'updateOne'>

const createTestAdapter = ({
  shouldFailOnTitle,
}: {
  shouldFailOnTitle?: string
} = {}): {
  adapter: TestAdapter
  executionOrder: string[]
  receivedRequests: (Partial<PayloadRequest> | undefined)[]
} => {
  const documents = new Map<number | string, Document>([
    [1, { id: 1, title: 'first' }],
    [2, { id: 2, title: 'second' }],
  ])
  const executionOrder: string[] = []
  const receivedRequests: (Partial<PayloadRequest> | undefined)[] = []
  let nextID = 3

  const adapter: TestAdapter = {
    create: async ({ data, req, returning }) => {
      const document = { ...data, id: nextID }

      nextID += 1
      executionOrder.push(`create:${String(document.id)}`)
      receivedRequests.push(req)
      documents.set(document.id, document)

      return returning === false ? null : document
    },
    deleteOne: async ({ req, returning, where }) => {
      const id = where.id?.equals as number | string
      const document = documents.get(id) ?? null

      executionOrder.push(`delete:${String(id)}`)
      receivedRequests.push(req)

      if (document) {
        documents.delete(id)
      }

      return returning === false ? null : document
    },
    updateOne: async ({ data, req, returning, where }) => {
      const id = where?.id?.equals as number | string
      const document = documents.get(id)

      executionOrder.push(`update:${String(id)}`)
      receivedRequests.push(req)

      if (data.title === shouldFailOnTitle) {
        throw new Error(`failed:${String(data.title)}`)
      }

      if (!document) {
        return null
      }

      const updatedDocument = { ...document, ...data }

      documents.set(id, updatedDocument)

      return returning === false ? null : updatedDocument
    },
  }

  return { adapter, executionOrder, receivedRequests }
}

describe('defaultBatchProcessing', () => {
  test('should register the default processor on adapters that do not provide one', async () => {
    const { adapter } = createTestAdapter()
    const registeredAdapter = createDatabaseAdapter(adapter as BaseDatabaseAdapter)

    const results = await registeredAdapter.batchProcessing({
      operations: [
        {
          args: { collection: 'posts', data: { title: 'created' }, returning: false },
          operation: 'create',
        },
      ],
    })

    expect(results).toEqual([{ documentID: 3, index: 0, operation: 'create', status: 'succeeded' }])
  })

  test('should execute mixed operations in order and preserve shared request context', async () => {
    const { adapter, executionOrder, receivedRequests } = createTestAdapter()
    const req = { transactionID: 'outer-transaction' }

    const results = await defaultBatchProcessing.call(adapter as BaseDatabaseAdapter, {
      batchSize: 2,
      operations: [
        {
          args: { collection: 'posts', data: { title: 'created' }, returning: false },
          operation: 'create',
        },
        {
          args: {
            collection: 'posts',
            data: { title: 'updated' },
            returning: false,
            where: { id: { equals: 1 } },
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: 'posts',
            returning: false,
            where: { id: { equals: 2 } },
          },
          operation: 'deleteOne',
        },
      ],
      req,
    })

    expect(executionOrder).toEqual(['create:3', 'update:1', 'delete:2'])
    expect(receivedRequests).toEqual([req, req, req])
    expect(results).toEqual([
      { documentID: 3, index: 0, operation: 'create', status: 'succeeded' },
      { documentID: 1, index: 1, operation: 'updateOne', status: 'succeeded' },
      { documentID: 2, index: 2, operation: 'deleteOne', status: 'succeeded' },
    ])
  })

  test('should distinguish a missing match when returned documents are disabled', async () => {
    const { adapter } = createTestAdapter()

    const results = await defaultBatchProcessing.call(adapter as BaseDatabaseAdapter, {
      operations: [
        {
          args: {
            collection: 'posts',
            data: { title: 'missing' },
            returning: false,
            where: { id: { equals: 99 } },
          },
          operation: 'updateOne',
        },
      ],
    })

    expect(results).toEqual([{ index: 0, operation: 'updateOne', status: 'noMatch' }])
  })

  test('should stop after a failure and mark later operations as unattempted', async () => {
    const { adapter, executionOrder } = createTestAdapter({ shouldFailOnTitle: 'fail' })

    const results = await defaultBatchProcessing.call(adapter as BaseDatabaseAdapter, {
      batchSize: 2,
      operations: [
        {
          args: {
            collection: 'posts',
            data: { title: 'updated' },
            where: { id: { equals: 1 } },
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: 'posts',
            data: { title: 'fail' },
            where: { id: { equals: 2 } },
          },
          operation: 'updateOne',
        },
        {
          args: { collection: 'posts', data: { title: 'not attempted' } },
          operation: 'create',
        },
      ],
    })

    expect(executionOrder).toEqual(['update:1', 'update:2'])
    expect(results[0]).toMatchObject({ documentID: 1, index: 0, status: 'succeeded' })
    expect(results[1]).toMatchObject({ index: 1, operation: 'updateOne', status: 'failed' })
    expect(results[2]).toEqual({ index: 2, operation: 'create', status: 'unattempted' })
  })

  test('should continue after a failure only when the caller requests it', async () => {
    const { adapter, executionOrder } = createTestAdapter({ shouldFailOnTitle: 'fail' })

    const results = await defaultBatchProcessing.call(adapter as BaseDatabaseAdapter, {
      operations: [
        {
          args: {
            collection: 'posts',
            data: { title: 'fail' },
            where: { id: { equals: 1 } },
          },
          operation: 'updateOne',
        },
        {
          args: { collection: 'posts', data: { title: 'created' } },
          operation: 'create',
        },
      ],
      shouldContinueOnError: true,
    })

    expect(executionOrder).toEqual(['update:1', 'create:3'])
    expect(results[0]).toMatchObject({ index: 0, operation: 'updateOne', status: 'failed' })
    expect(results[1]).toMatchObject({ documentID: 3, index: 1, status: 'succeeded' })
  })

  test('should reject an unsupported operation kind without attempting later work', async () => {
    const { adapter, executionOrder } = createTestAdapter()

    const results = await defaultBatchProcessing.call(adapter as BaseDatabaseAdapter, {
      operations: [
        { args: { collection: 'posts' }, operation: 'replace' } as never,
        {
          args: { collection: 'posts', data: { title: 'not attempted' } },
          operation: 'create',
        },
      ],
    })

    expect(executionOrder).toEqual([])
    expect(results[0]).toMatchObject({
      error: expect.any(TypeError),
      index: 0,
      operation: 'replace',
      status: 'failed',
    })
    expect(results[1]).toEqual({ index: 1, operation: 'create', status: 'unattempted' })
  })
})
