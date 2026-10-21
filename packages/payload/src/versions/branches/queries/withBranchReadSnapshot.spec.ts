import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import {
  captureBranchProjectionGuard,
  validateBranchProjectionGuard,
} from './branchProjectionGuard.js'
import {
  captureBranchReadProjectionGuard,
  withBranchReadSnapshot,
} from './withBranchReadSnapshot.js'

const control = { states: 'states', invalidations: 'invalidations' }
const shared = { type: 'shared' } as const
const en = { type: 'locale', locale: 'en' } as const
const request = () => {
  const find = vi.fn(async ({ where }) => ({
    docs: where.and[2].scopeKey.in.map((scopeKey: string) => ({
      id: scopeKey,
      generation: 1,
      isInitialized: true,
      pendingCount: 0,
      scopeKey,
    })),
  }))
  const req = {
    payload: { db: { find, branching: { withReadSnapshot: ({ req, read }) => read({ req }) } } },
  } as unknown as PayloadRequest

  return { find, req }
}

describe('verified branch read frame guards', () => {
  it('should reuse readiness coverage only in one verified frame while observing new locales and branches', async () => {
    const { find, req } = request()
    const capture = (args = {}) =>
      captureBranchReadProjectionGuard({
        branchID: 'drafts',
        control,
        req,
        scopes: [shared],
        ...args,
      })

    await withBranchReadSnapshot({
      req,
      read: async () => {
        await capture()
        await withBranchReadSnapshot({
          req,
          read: async () => {
            await capture()
          },
        })
        await capture({ scopes: [shared, en] })
        await capture({ branchID: 'staging' })
        expect(find).toHaveBeenCalledTimes(3)
        expect(find.mock.calls[1][0].where.and[2].scopeKey.in).toEqual(['locale:en'])
      },
    })
    await withBranchReadSnapshot({ req, read: capture })
    expect(find).toHaveBeenCalledTimes(4)
    await captureBranchProjectionGuard({ branchID: 'drafts', control, req, scopes: [shared] })
    expect(find).toHaveBeenCalledTimes(5)
  })

  it('should share concurrent initial observations but never a failed frame or standalone optimistic validation', async () => {
    const { find, req } = request()
    const capture = () =>
      captureBranchReadProjectionGuard({ branchID: 'drafts', control, req, scopes: [shared] })

    await expect(
      withBranchReadSnapshot({
        req,
        read: async () => {
          const [first, second] = await Promise.all([capture(), capture()])
          expect(first).toEqual(second)
          expect(find).toHaveBeenCalledTimes(1)
          throw new Error('stop')
        },
      }),
    ).rejects.toThrow('stop')
    const guard = await withBranchReadSnapshot({ req, read: capture })
    expect(find).toHaveBeenCalledTimes(2)
    find.mockResolvedValueOnce({ docs: [] })
    await expect(validateBranchProjectionGuard({ guard, req })).rejects.toMatchObject({
      code: 'branch-projection-conflict',
    })
  })
})
