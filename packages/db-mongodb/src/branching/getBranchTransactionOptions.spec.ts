import { describe, expect, it } from 'vitest'

import type { TransactionOptions } from 'mongodb'

import type { MongooseAdapter } from '../index.js'

import { getBranchTransactionOptions } from './getBranchTransactionOptions.js'

const setup = ({
  hasBranchQueries,
  configured,
}: {
  hasBranchQueries: boolean
  configured?: TransactionOptions
}): MongooseAdapter =>
  ({
    payload: {
      collections: {
        documents: {
          config: { custom: hasBranchQueries ? { branchQueryStorage: {} } : { branchStorage: {} } },
        },
      },
    },
    transactionOptions: configured,
  }) as unknown as MongooseAdapter

describe('Branch-enabled Mongo transaction defaults', () => {
  it('should leave unregistered/history-only legacy concerns and option identity unchanged', () => {
    const configured = { maxCommitTimeMS: 1000 }
    expect(
      getBranchTransactionOptions({ adapter: setup({ hasBranchQueries: false, configured }) }),
    ).toBe(configured)
    expect(
      getBranchTransactionOptions({ adapter: setup({ hasBranchQueries: false }) }),
    ).toBeUndefined()
  })

  it('should fill only missing snapshot and majority defaults while retaining other fields', () => {
    expect(
      getBranchTransactionOptions({
        adapter: setup({
          hasBranchQueries: true,
          configured: { maxCommitTimeMS: 1000, writeConcern: { j: true, wtimeoutMS: 500 } },
        }),
      }),
    ).toEqual({
      maxCommitTimeMS: 1000,
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority', j: true, wtimeoutMS: 500 },
    })
  })

  it('should preserve explicit configured and per-call precedence including weaker concerns', () => {
    const adapter = setup({
      hasBranchQueries: true,
      configured: { readConcern: { level: 'local' }, writeConcern: { w: 1 } },
    })
    expect(getBranchTransactionOptions({ adapter })).toEqual({
      readConcern: { level: 'local' },
      writeConcern: { w: 1 },
    })
    expect(
      getBranchTransactionOptions({
        adapter,
        options: { readConcern: { level: 'majority' }, writeConcern: { w: 0, j: false } },
      }),
    ).toEqual({ readConcern: { level: 'majority' }, writeConcern: { w: 0, j: false } })
    expect(getBranchTransactionOptions({ adapter, options: {} })).toEqual({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
  })
})
