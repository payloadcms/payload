import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { getAdminPreferences } from './getAdminPreferences.js'
import { getRequestBranch } from './getRequestBranch.js'

describe('navigation preference compatibility', () => {
  it.each([
    { branch: undefined, expectedBranch: 'main', isBranchingEnabled: true },
    { branch: 'fall-campaign', expectedBranch: 'fall-campaign', isBranchingEnabled: true },
    { branch: 'fall-campaign', expectedBranch: 'main', isBranchingEnabled: false },
  ])(
    'should preserve navigation state with branching $isBranchingEnabled and branch $expectedBranch',
    async ({ branch, expectedBranch, isBranchingEnabled }) => {
      const savedPreferences = {
        ...(branch ? { branch } : {}),
        groups: { Content: { open: false } },
        open: false,
      }
      const find = vi.fn(async ({ where }: { where: { and: { key?: { equals: string } }[] } }) => ({
        docs: where.and.some(({ key }) => key?.equals === 'nav')
          ? [{ value: savedPreferences }]
          : [],
      }))
      const req = {
        context: {},
        transactionID: 'document-transaction',
        payload: {
          config: { branching: { enabled: isBranchingEnabled } },
          find,
        },
        user: { id: 'user-123', collection: 'users' },
      } as unknown as PayloadRequest

      const preferences = await getAdminPreferences({ req })
      const activeBranch = await getRequestBranch({ req })

      expect(preferences).toEqual(savedPreferences)
      expect(activeBranch).toBe(expectedBranch)
      expect(find).toHaveBeenCalledTimes(1)
      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({ req: expect.objectContaining({ transactionID: undefined }) }),
      )
      expect(req.transactionID).toBe('document-transaction')
    },
  )
})
