import type { PayloadRequest } from '../../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { jobAfterRead } from '../config/collection.js'
import { updateJobs } from './updateJob.js'

vi.mock('../config/collection.js', () => ({
  jobAfterRead: vi.fn(),
}))

const transactionID = 'queue-transaction'

const beginTransaction = vi.fn()
const commitTransaction = vi.fn()
const rollbackTransaction = vi.fn()
const updateJobsInDatabase = vi.fn()

const req = {
  payload: {
    config: {},
    db: {
      beginTransaction,
      commitTransaction,
      name: 'postgres',
      rollbackTransaction,
      updateJobs: updateJobsInDatabase,
    },
  },
} as unknown as PayloadRequest

describe('updateJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    beginTransaction.mockResolvedValue(transactionID)
    commitTransaction.mockResolvedValue(undefined)
    rollbackTransaction.mockResolvedValue(undefined)
    updateJobsInDatabase.mockResolvedValue([])
    vi.mocked(jobAfterRead).mockImplementation(({ doc }) => doc)
  })

  it('should roll back its transaction when updating jobs fails', async () => {
    const updateError = new Error('update jobs failed')

    updateJobsInDatabase.mockRejectedValue(updateError)

    await expect(updateJobs({ data: {}, id: 'job-id', req, returning: false })).rejects.toBe(
      updateError,
    )
    expect(
      rollbackTransaction,
      'ROLLBACK_SENTINEL: updateJobs failure left its transaction open',
    ).toHaveBeenCalledWith(transactionID)
    expect(commitTransaction).not.toHaveBeenCalled()
  })

  it('should roll back its transaction when committing fails', async () => {
    const commitError = new Error('commit failed')

    commitTransaction.mockRejectedValue(commitError)

    await expect(updateJobs({ data: {}, id: 'job-id', req, returning: false })).rejects.toBe(
      commitError,
    )
    expect(rollbackTransaction).toHaveBeenCalledWith(transactionID)
  })

  it('should preserve the original error when rolling back fails', async () => {
    const rollbackError = new Error('rollback failed')
    const updateError = new Error('update jobs failed')

    rollbackTransaction.mockRejectedValue(rollbackError)
    updateJobsInDatabase.mockRejectedValue(updateError)

    await expect(updateJobs({ data: {}, id: 'job-id', req, returning: false })).rejects.toBe(
      updateError,
    )
    expect(rollbackTransaction).toHaveBeenCalledWith(transactionID)
  })

  it('should not roll back after the transaction has committed', async () => {
    const afterReadError = new Error('after read failed')

    updateJobsInDatabase.mockResolvedValue([{ id: 'job-id' }])
    vi.mocked(jobAfterRead).mockImplementation(() => {
      throw afterReadError
    })

    await expect(updateJobs({ data: {}, id: 'job-id', req })).rejects.toBe(afterReadError)
    expect(commitTransaction).toHaveBeenCalledWith(transactionID)
    expect(rollbackTransaction).not.toHaveBeenCalled()
  })
})
