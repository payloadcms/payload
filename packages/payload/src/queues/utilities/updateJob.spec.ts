import type { Job } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { jobAfterRead } from '../config/collection.js'
import { updateJobs } from './updateJob.js'

vi.mock('../config/collection.js', () => ({
  jobAfterRead: vi.fn(),
  jobsCollectionSlug: 'payload-jobs',
}))

const transactionID = 'queue-transaction'

const beginTransaction = vi.fn()
const commitTransaction = vi.fn()
const rollbackTransaction = vi.fn()
const updateJobsInDatabase = vi.fn()

const createRequest = ({ databaseName = 'postgres' }: { databaseName?: string } = {}) =>
  ({
    payload: {
      config: {},
      db: {
        beginTransaction,
        commitTransaction,
        name: databaseName,
        rollbackTransaction,
        updateJobs: updateJobsInDatabase,
      },
    },
  }) as unknown as PayloadRequest

describe('updateJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    beginTransaction.mockResolvedValue(transactionID)
    commitTransaction.mockResolvedValue(undefined)
    rollbackTransaction.mockResolvedValue(undefined)
    updateJobsInDatabase.mockResolvedValue([])
    vi.mocked(jobAfterRead).mockImplementation(({ doc }) => doc)
  })

  it('should pass its transaction to the update and commit it on success', async () => {
    const updatedJob = { id: 'job-id' } as Job
    updateJobsInDatabase.mockResolvedValue([updatedJob])

    await expect(updateJobs({ data: {}, id: 'job-id', req: createRequest() })).resolves.toEqual([
      updatedJob,
    ])

    expect(beginTransaction).toHaveBeenCalledOnce()
    expect(updateJobsInDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-id',
        req: { transactionID },
      }),
    )
    expect(commitTransaction).toHaveBeenCalledWith(transactionID)
    expect(rollbackTransaction).not.toHaveBeenCalled()
    expect(jobAfterRead).toHaveBeenCalledWith({ config: {}, doc: updatedJob })
  })

  it.each([0, transactionID])(
    'should roll back transaction %s when updating jobs fails',
    async (id) => {
      beginTransaction.mockResolvedValue(id)
      const updateError = new Error('update jobs failed')
      updateJobsInDatabase.mockRejectedValue(updateError)

      await expect(
        updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false }),
      ).rejects.toBe(updateError)

      expect(rollbackTransaction).toHaveBeenCalledWith(id)
      expect(commitTransaction).not.toHaveBeenCalled()
    },
  )

  it('should roll back its transaction when committing fails', async () => {
    const commitError = new Error('commit failed')
    commitTransaction.mockRejectedValue(commitError)

    await expect(
      updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false }),
    ).rejects.toBe(commitError)

    expect(rollbackTransaction).toHaveBeenCalledWith(transactionID)
  })

  const updateError = new Error('update failed')
  const commitError = new Error('commit failed')

  it.each([
    {
      configureFailure: () => updateJobsInDatabase.mockRejectedValue(updateError),
      originalError: updateError,
    },
    {
      configureFailure: () => commitTransaction.mockRejectedValue(commitError),
      originalError: commitError,
    },
  ])(
    'should preserve the $originalError.message error when rollback also fails',
    async ({ configureFailure, originalError }) => {
      configureFailure()
      rollbackTransaction.mockRejectedValue(new Error('rollback failed'))

      await expect(
        updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false }),
      ).rejects.toBe(originalError)

      expect(rollbackTransaction).toHaveBeenCalledWith(transactionID)
    },
  )

  it.each([0, 'queue-transaction'])(
    'should commit transaction %s, including a zero transaction ID',
    async (id) => {
      beginTransaction.mockResolvedValue(id)

      await updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false })

      expect(updateJobsInDatabase).toHaveBeenCalledWith(
        expect.objectContaining({ req: { transactionID: id } }),
      )
      expect(commitTransaction).toHaveBeenCalledWith(id)
    },
  )

  it('should not roll back an afterRead failure after the transaction has committed', async () => {
    const afterReadError = new Error('after read failed')
    updateJobsInDatabase.mockResolvedValue([{ id: 'job-id' }])
    vi.mocked(jobAfterRead).mockImplementation(() => {
      throw afterReadError
    })

    await expect(updateJobs({ data: {}, id: 'job-id', req: createRequest() })).rejects.toBe(
      afterReadError,
    )

    expect(commitTransaction).toHaveBeenCalledWith(transactionID)
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })

  it('should not manage transactions for mongoose', async () => {
    const updateError = new Error('update failed')
    updateJobsInDatabase.mockRejectedValue(updateError)

    await expect(
      updateJobs({
        data: {},
        id: 'job-id',
        req: createRequest({ databaseName: 'mongoose' }),
        returning: false,
      }),
    ).rejects.toBe(updateError)

    expect(beginTransaction).not.toHaveBeenCalled()
    expect(updateJobsInDatabase).toHaveBeenCalledWith(
      expect.objectContaining({ req: { transactionID: undefined } }),
    )
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })

  it('should not commit or roll back when the adapter does not start a transaction', async () => {
    beginTransaction.mockResolvedValue(null)

    await expect(
      updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false }),
    ).resolves.toBeNull()

    expect(updateJobsInDatabase).toHaveBeenCalledWith(
      expect.objectContaining({ req: { transactionID: undefined } }),
    )
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })

  it('should not roll back a failed update when the adapter did not start a transaction', async () => {
    const updateError = new Error('update failed')
    beginTransaction.mockResolvedValue(null)
    updateJobsInDatabase.mockRejectedValue(updateError)

    await expect(
      updateJobs({ data: {}, id: 'job-id', req: createRequest(), returning: false }),
    ).rejects.toBe(updateError)

    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })
})
