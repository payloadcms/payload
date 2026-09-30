import { expect, test, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { ValidationError } from '../errors/ValidationError.js'
import {
  createShadowRow,
  isConcurrentShadowOperationError,
  retryConcurrentShadowOperation,
} from './createShadowRow.js'

const branch = 'feature'
const collectionSlug = 'posts'
const data = { _branch: branch, _branchDocID: 'main-id', title: 'Shadow' }
const docID = 'main-id'
const shadow = { ...data, id: 'shadow-id' }

test('should use database copy for a shadow with an explicit source', async () => {
  const copy = vi.fn().mockResolvedValue(shadow)
  const create = vi.fn()
  const onCreated = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: {
      db: {
        beginTransaction: vi.fn().mockResolvedValue('copy-transaction'),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        copy,
        create,
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated,
      req,
      source: { branch: 'main', id: docID },
    }),
  ).resolves.toBe(shadow)

  const copyReq = copy.mock.calls[0]![0].req as PayloadRequest

  expect(copy).toHaveBeenCalledWith({
    collection: collectionSlug,
    data,
    destination: { branch },
    req: copyReq,
    source: { branch: 'main', id: docID },
  })
  expect(create).not.toHaveBeenCalled()
  expect(onCreated).toHaveBeenCalledWith(copyReq, shadow)
})

test('should recover a competing database copy after a uniqueness failure', async () => {
  const copyError = new ValidationError({
    collection: collectionSlug,
    errors: [{ message: 'Value must be unique', path: '_branchDocID' }],
  })
  const create = vi.fn()
  const findOne = vi.fn().mockResolvedValue(shadow)
  const req = {
    payload: {
      db: {
        copy: vi.fn().mockRejectedValue(copyError),
        create,
        findOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: vi.fn(),
      req,
      source: { branch: 'main', id: docID },
    }),
  ).resolves.toBe(shadow)

  expect(create).not.toHaveBeenCalled()
  expect(findOne).toHaveBeenCalledTimes(2)
  expect(findOne.mock.calls[1]![0]).toMatchObject({ collection: 'payload-branch-changes' })
})

test('should reject a competing shadow without a change record', async () => {
  const copyError = new ValidationError({
    collection: collectionSlug,
    errors: [{ message: 'Value must be unique', path: '_branchDocID' }],
  })
  const findOne = vi
    .fn()
    .mockImplementation(({ collection }: { collection: string }) =>
      Promise.resolve(collection === 'payload-branch-changes' ? null : shadow),
    )
  const req = {
    payload: {
      db: {
        copy: vi.fn().mockRejectedValue(copyError),
        findOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: vi.fn(),
      req,
      source: { branch: 'main', id: docID },
    }),
  ).rejects.toMatchObject({ status: 409 })

  expect(findOne).toHaveBeenCalledTimes(2)
  expect(findOne.mock.calls[1]![0]).toMatchObject({ collection: 'payload-branch-changes' })
})

test('should create the shadow and registry in an ambient transaction without resolving it', async () => {
  const callerFile = { name: 'upload.txt' }
  const commitTransaction = vi.fn()
  const create = vi.fn().mockResolvedValue(shadow)
  const onCreated = vi.fn().mockImplementation((createReq: PayloadRequest) => {
    delete createReq.file

    return Promise.resolve()
  })
  const rollbackTransaction = vi.fn()
  const req = {
    file: callerFile,
    payload: {
      db: {
        beginTransaction: vi.fn(),
        commitTransaction,
        create,
        rollbackTransaction,
      },
    },
    transactionID: 'operation-transaction',
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated,
      req,
      useAmbientTransaction: true,
    }),
  ).resolves.toBe(shadow)

  const ambientReq = create.mock.calls[0]![0].req as PayloadRequest

  expect(create).toHaveBeenCalledWith({
    collection: collectionSlug,
    data,
    req: ambientReq,
  })
  expect(ambientReq).not.toBe(req)
  expect(ambientReq.transactionID).toBe('operation-transaction')
  expect(onCreated).toHaveBeenCalledWith(ambientReq, shadow)
  expect(commitTransaction).not.toHaveBeenCalled()
  expect(rollbackTransaction).not.toHaveBeenCalled()
  expect(req.file).toBe(callerFile)
  expect(req.transactionID).toBe('operation-transaction')
})

test('should leave a transient ambient failure for the transaction owner to handle', async () => {
  const createError = {
    hasErrorLabel: (label: string) => label === 'TransientTransactionError',
    message: 'Please retry your operation or multi-document transaction.',
  }
  const beginTransaction = vi.fn()
  const findOne = vi.fn()
  const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: {
      db: {
        beginTransaction,
        create: vi.fn().mockRejectedValue(createError),
        findOne,
        rollbackTransaction,
      },
    },
    transactionID: 'operation-transaction',
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: vi.fn(),
      req,
      useAmbientTransaction: true,
    }),
  ).rejects.toBe(createError)

  expect(rollbackTransaction).not.toHaveBeenCalled()
  expect(findOne).not.toHaveBeenCalled()
  expect(beginTransaction).not.toHaveBeenCalled()
  expect(req.transactionID).toBe('operation-transaction')
  expect(isConcurrentShadowOperationError(createError)).toBe(true)
})

test('should leave an ambient transaction owner to handle an onCreated failure', async () => {
  const onCreatedError = new Error('registry create failed')
  const deleteOne = vi.fn()
  const rollbackTransaction = vi.fn()
  const req = {
    payload: {
      db: {
        create: vi.fn().mockResolvedValue(shadow),
        deleteOne,
        rollbackTransaction,
      },
    },
    transactionID: 'operation-transaction',
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.reject(onCreatedError),
      req,
      useAmbientTransaction: true,
    }),
  ).rejects.toBe(onCreatedError)

  expect(deleteOne).not.toHaveBeenCalled()
  expect(rollbackTransaction).not.toHaveBeenCalled()
  expect(req.transactionID).toBe('operation-transaction')
  expect(isConcurrentShadowOperationError(onCreatedError)).toBe(false)
})

test('should rethrow an onCreated failure when transactions are unavailable', async () => {
  const onCreatedError = new Error('registry create failed')
  const deleteOne = vi.fn().mockResolvedValue(shadow)
  const findOne = vi.fn().mockResolvedValue(shadow)
  const req = {
    payload: {
      db: {
        create: vi.fn().mockResolvedValue(shadow),
        deleteOne,
        findOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.reject(onCreatedError),
      req,
    }),
  ).rejects.toBe(onCreatedError)

  expect(findOne).not.toHaveBeenCalled()
  expect(deleteOne).toHaveBeenCalledWith({
    branch: false,
    collection: collectionSlug,
    req: expect.anything(),
    where: { id: { equals: shadow.id } },
  })
})

test('should preserve an onCreated failure when shadow cleanup also fails', async () => {
  const cleanupError = new Error('shadow cleanup failed')
  const onCreatedError = new Error('registry create failed')
  const deleteOne = vi.fn().mockRejectedValue(cleanupError)
  const req = {
    payload: {
      db: {
        create: vi.fn().mockResolvedValue(shadow),
        deleteOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.reject(onCreatedError),
      req,
    }),
  ).rejects.toBe(onCreatedError)

  expect(deleteOne).toHaveBeenCalledWith({
    branch: false,
    collection: collectionSlug,
    req: expect.anything(),
    where: { id: { equals: shadow.id } },
  })
})

test('should rethrow a non-validation create failure when a shadow row is visible', async () => {
  const createError = new Error('database unavailable')
  const findOne = vi.fn().mockResolvedValue(shadow)
  const req = {
    payload: {
      db: {
        create: vi.fn().mockRejectedValue(createError),
        findOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).rejects.toBe(createError)

  expect(findOne).not.toHaveBeenCalled()
})

test('should rethrow an unrelated validation create failure when a shadow row is visible', async () => {
  const createError = new ValidationError({
    collection: collectionSlug,
    errors: [{ message: 'Value is invalid', path: 'title' }],
  })
  const findOne = vi.fn().mockResolvedValue(shadow)
  const req = {
    payload: {
      db: {
        create: vi.fn().mockRejectedValue(createError),
        findOne,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).rejects.toBe(createError)

  expect(findOne).not.toHaveBeenCalled()
})

test.each([
  '_branchDocID',
  '_branch_doc_id',
  '_branchdocid_id',
  '_branchdocid_id, _branch',
  'documentID',
  '_branch',
])('should return a competing shadow row after a %s uniqueness failure', async (path) => {
  const createError = new ValidationError({
    collection: collectionSlug,
    errors: [{ message: 'Value must be unique', path }],
  })
  const req = {
    payload: {
      db: {
        create: vi.fn().mockRejectedValue(createError),
        findOne: vi.fn().mockResolvedValue(shadow),
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).resolves.toBe(shadow)
})

test('should retry outside a caller transaction until a delayed competing shadow is visible', async () => {
  const createError = {
    errorLabels: ['TransientTransactionError'],
    message: 'Please retry your operation or multi-document transaction.',
  }
  let recoveryReads = 0
  const findOne = vi.fn().mockImplementation(({ req: recoveryReq }: { req: PayloadRequest }) => {
    if (recoveryReq.transactionID) {
      return Promise.resolve(null)
    }

    recoveryReads += 1

    return Promise.resolve(recoveryReads <= 5 ? null : shadow)
  })
  const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: {
      db: {
        beginTransaction: vi.fn().mockResolvedValue('transaction-id'),
        create: vi.fn().mockRejectedValue(createError),
        findOne,
        rollbackTransaction,
      },
    },
    transactionID: 'outer-transaction',
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).resolves.toBe(shadow)

  expect(rollbackTransaction).toHaveBeenCalledWith('transaction-id')
  expect(findOne).toHaveBeenCalledTimes(7)
  expect(findOne.mock.calls[6]![0]).toMatchObject({ collection: 'payload-branch-changes' })
  expect(req.transactionID).toBe('outer-transaction')
})

test('should retry a whole operation until a transient branch conflict clears', async () => {
  const createError = {
    errorLabels: ['TransientTransactionError'],
    message: 'Please retry your operation or multi-document transaction.',
  }
  const operation = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(createError)
    .mockRejectedValueOnce(createError)
    .mockResolvedValue('updated')
  const onRetry = vi.fn()
  const waitForRetry = vi.fn().mockResolvedValue(undefined)

  await expect(
    retryConcurrentShadowOperation({
      onRetry,
      operation,
      shouldRetry: true,
      waitForRetry,
    }),
  ).resolves.toBe('updated')

  expect(operation).toHaveBeenCalledTimes(3)
  expect(onRetry).toHaveBeenCalledTimes(2)
  expect(waitForRetry).toHaveBeenNthCalledWith(1, { retryIndex: 0 })
  expect(waitForRetry).toHaveBeenNthCalledWith(2, { retryIndex: 1 })
})

test.each([
  ['a caller-owned transaction', false, { errorLabels: ['TransientTransactionError'] }],
  ['a business error', true, new Error('hook failed')],
] as const)('should not retry %s', async (_scenario, shouldRetry, operationError) => {
  const operation = vi.fn().mockRejectedValue(operationError)

  await expect(
    retryConcurrentShadowOperation({
      operation,
      shouldRetry,
      waitForRetry: vi.fn(),
    }),
  ).rejects.toBe(operationError)

  expect(operation).toHaveBeenCalledOnce()
})

test('should preserve the original transient error when retries are exhausted', async () => {
  const operationError = { errorLabels: ['TransientTransactionError'] }
  const operation = vi.fn().mockRejectedValue(operationError)
  const onRetry = vi.fn()

  await expect(
    retryConcurrentShadowOperation({
      onRetry,
      operation,
      shouldRetry: true,
      waitForRetry: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toBe(operationError)

  expect(operation).toHaveBeenCalledTimes(8)
  expect(onRetry).toHaveBeenCalledTimes(7)
})

test('should not replay an operation whose commit result is unknown', async () => {
  const commitError = {
    errorLabels: ['TransientTransactionError', 'UnknownTransactionCommitResult'],
  }
  const operation = vi.fn().mockRejectedValue(commitError)

  await expect(
    retryConcurrentShadowOperation({
      operation,
      shouldRetry: true,
      waitForRetry: vi.fn().mockResolvedValue(undefined),
    }),
  ).rejects.toBe(commitError)

  expect(operation).toHaveBeenCalledOnce()
})

test('should rethrow a commit failure when the created shadow row is visible', async () => {
  const commitError = new Error('commit failed')
  const findOne = vi.fn().mockResolvedValue(shadow)
  const req = {
    payload: {
      db: {
        beginTransaction: vi.fn().mockResolvedValue('transaction-id'),
        commitTransaction: vi.fn().mockRejectedValue(commitError),
        create: vi.fn().mockResolvedValue(shadow),
        findOne,
        rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).rejects.toBe(commitError)

  expect(findOne).not.toHaveBeenCalled()
})

test('should recover a competing shadow when commit reports a transient conflict', async () => {
  const commitError = {
    errorLabels: ['TransientTransactionError'],
    message: 'Please retry your operation or multi-document transaction.',
  }
  const findOne = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(shadow)
  const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: {
      db: {
        beginTransaction: vi.fn().mockResolvedValue('transaction-id'),
        commitTransaction: vi.fn().mockRejectedValue(commitError),
        create: vi.fn().mockResolvedValue(shadow),
        findOne,
        rollbackTransaction,
      },
    },
  } as unknown as PayloadRequest

  await expect(
    createShadowRow({
      branch,
      collectionSlug,
      data,
      docID,
      onCreated: () => Promise.resolve(),
      req,
    }),
  ).resolves.toBe(shadow)

  expect(rollbackTransaction).toHaveBeenCalledWith('transaction-id')
  expect(findOne).toHaveBeenCalledTimes(2)
})
