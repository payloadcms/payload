import type { Payload, PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { runTransactionRollbackCallbacks } from '../utilities/transactionCallbacks.js'
import { mergeBranch } from './merge.js'
import { restoreBranchAfterMerge } from './merge/branchMergeStatus.js'
import { prepareMerge } from './merge/prepareMerge.js'

vi.mock('./discard.js', () => ({ discardBranchChanges: vi.fn() }))
vi.mock('./assertBranchUpdateAccess.js', () => ({ assertBranchUpdateAccess: vi.fn() }))
vi.mock('./resolveBranch.js', () => ({ refreshBranchState: vi.fn() }))
vi.mock('./merge/executeMerge.js', () => ({
  executeMerge: vi.fn(),
  unknownMergeCommitResultContextKey: 'unknown',
}))
vi.mock('./merge/branchMergeStatus.js', () => ({
  beginBranchMerge: vi.fn(),
  restoreBranchAfterMerge: vi.fn(),
}))
vi.mock('./merge/prepareMerge.js', () => ({ prepareMerge: vi.fn() }))
vi.mock('./merge/retryFailedCleanups.js', () => ({
  retryFailedCleanups: vi.fn(async () => ({ retried: [{ changeID: 'change' }] })),
}))

describe('cleanup-only merge transactions', () => {
  it('should restore the branch claim when the caller rolls back', async () => {
    const payload = {
      count: vi.fn(async () => ({ totalDocs: 0 })),
      db: {},
      update: vi.fn(),
    } as unknown as Payload
    const req = { context: {}, payload, transactionID: 'caller' } as PayloadRequest
    const result = {
      blocked: [],
      canMerge: true,
      mergeable: [],
      merged: [],
      validationErrors: [],
      warnings: [],
    }

    vi.mocked(prepareMerge).mockResolvedValue({
      applicable: [],
      applicableGlobals: [],
      branchDoc: { id: 'branch' },
      mergeable: [{ changeID: 'change' }],
      req,
      result,
      retryableCleanups: [{ changeID: 'change' }],
    } as unknown as Awaited<ReturnType<typeof prepareMerge>>)

    await mergeBranch(payload, { branch: 'branch', overrideAccess: true })

    expect(restoreBranchAfterMerge).not.toHaveBeenCalled()
    await runTransactionRollbackCallbacks({ req, transactionID: 'caller' })
    expect(restoreBranchAfterMerge).toHaveBeenCalledWith({ branchDocID: 'branch', payload, req })
  })
})
