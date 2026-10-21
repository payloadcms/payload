import type { PayloadRequest } from '../../../types/index.js'
import type { BranchContentScope } from '../types.js'

import { describe, expect, it, vi } from 'vitest'

import {
  captureBranchProjectionGuard,
  validateBranchProjectionGuard,
} from './branchProjectionGuard.js'
import {
  captureBranchReadProjectionGuard,
  captureBranchReadProjectionGuards,
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
  const batchedRequest = () => {
    const { find, req } = request()
    const findOne = vi.fn(async () => null)
    const readStates = vi.fn(async ({ reads }) =>
      reads.flatMap(({ branchKey, collection, scopes }) =>
        scopes.map(({ rowKey, scopeKey }) => ({
          collection,
          branchKey,
          rowKey,
          scopeKey,
          id: scopeKey === 'shared' ? 1 : scopeKey === 'locale:en' ? 2 : 3,
          generation: 2,
          isInitialized: true,
          pendingCount: 0,
        })),
      ),
    )

    Object.assign(req.payload.db, { findOne })
    req.payload.db.branching!.queryProjection = { readStates } as unknown as NonNullable<
      typeof req.payload.db.branching
    >['queryProjection']
    return { find, findOne, readStates, req }
  }

  it('should batch all reachable controls while keeping same native IDs in different controls and frame-local locale coverage', async () => {
    const { find, readStates, req } = batchedRequest()
    const controls = [control, { states: 'related-states', invalidations: 'related-invalidations' }]
    const capture = (scopes: readonly BranchContentScope[] = [shared, en]) =>
      captureBranchReadProjectionGuards({ branchID: 'drafts', controls, req, scopes })

    await withBranchReadSnapshot({
      req,
      read: async () => {
        const [first, concurrent] = await Promise.all([capture(), capture()])

        expect(first).toEqual(concurrent)
        expect(first.map(({ observations }) => observations)).toEqual([
          [
            { id: 1, generation: 2 },
            { id: 2, generation: 2 },
          ],
          [
            { id: 1, generation: 2 },
            { id: 2, generation: 2 },
          ],
        ])
        expect(readStates).toHaveBeenCalledTimes(1)
        expect(readStates.mock.calls[0][0].reads.map(({ collection }) => collection)).toEqual([
          'states',
          'related-states',
        ])
        await capture()
        const extended = await capture([shared, en, { type: 'locale', locale: 'fr' }])

        expect(extended.every(({ observations }) => observations.length === 3)).toBe(true)
        expect(extended[0]!.observations.map(({ id }) => id)).toEqual([1, 2, 3])
        expect(readStates).toHaveBeenCalledTimes(2)
        expect(
          readStates.mock.calls[1][0].reads.every(
            ({ scopes }) => scopes.length === 1 && scopes[0].scopeKey === 'locale:fr',
          ),
        ).toBe(true)
        expect(find).not.toHaveBeenCalled()
      },
    })
    await withBranchReadSnapshot({ req, read: () => capture() })
    expect(readStates).toHaveBeenCalledTimes(3)
    await captureBranchReadProjectionGuard({ branchID: 'drafts', control, req, scopes: [shared] })
    expect(find).toHaveBeenCalledTimes(1)
    expect(readStates).toHaveBeenCalledTimes(3)
  })

  it.each([
    { name: 'unexpected control', alter: (rows) => [{ ...rows[0], collection: 'other' }, rows[1]] },
    { name: 'unexpected branch', alter: (rows) => [{ ...rows[0], branchKey: 'other' }, rows[1]] },
    { name: 'unexpected scope', alter: (rows) => [{ ...rows[0], scopeKey: 'locale:fr' }, rows[1]] },
    { name: 'unexpected row key', alter: (rows) => [{ ...rows[0], rowKey: 'other' }, rows[1]] },
    { name: 'duplicate coordinate', alter: (rows) => [rows[0], rows[0]] },
    {
      name: 'duplicate control identity',
      alter: (rows) => [rows[0], { ...rows[1], id: rows[0].id }],
    },
    {
      name: 'untyped initialization',
      alter: (rows) => [{ ...rows[0], isInitialized: 1 }, rows[1]],
    },
    { name: 'missing identity', alter: (rows) => [{ ...rows[0], id: undefined }, rows[1]] },
  ])('should reject $name before accepting batched readiness', async ({ alter }) => {
    const { readStates, req } = batchedRequest()
    const original = readStates.getMockImplementation()!

    readStates.mockImplementationOnce(async (args) => alter(await original(args)))
    await expect(
      withBranchReadSnapshot({
        req,
        read: () =>
          captureBranchReadProjectionGuard({
            branchID: 'drafts',
            control,
            req,
            scopes: [shared, en],
          }),
      }),
    ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
  })

  it.each(['missing', 'pending', 'uninitialized', 'structural-conflict'])(
    'should preserve %s readiness errors for the affected control',
    async (failure) => {
      const { findOne, readStates, req } = batchedRequest()
      const original = readStates.getMockImplementation()!

      readStates.mockImplementationOnce(async (args) => {
        const rows = await original(args)

        return failure === 'missing'
          ? rows.slice(1)
          : [
              {
                ...rows[0],
                isInitialized: failure !== 'uninitialized',
                pendingCount: failure === 'uninitialized' ? 0 : 1,
              },
              rows[1],
            ]
      })
      if (failure === 'structural-conflict') {
        findOne.mockResolvedValueOnce({ state: 'structural-conflict' } as never)
      }
      await expect(
        withBranchReadSnapshot({
          req,
          read: () =>
            captureBranchReadProjectionGuard({
              branchID: 'drafts',
              control,
              req,
              scopes: [shared, en],
            }),
        }),
      ).rejects.toMatchObject({
        code:
          failure === 'structural-conflict'
            ? 'branch-structural-conflict'
            : 'branch-projection-not-ready',
      })
      expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ collection: 'invalidations' }))
    },
  )

  it.each([
    { generation: 0 },
    { generation: Number.MAX_SAFE_INTEGER },
    { pendingCount: -1 },
    { pendingCount: 0.5 },
  ])('should reject invalid batched counters %j', async (counter) => {
    const { readStates, req } = batchedRequest()
    const original = readStates.getMockImplementation()!

    readStates.mockImplementationOnce(async (args) =>
      (await original(args)).map((row) => ({ ...row, ...counter })),
    )
    await expect(
      withBranchReadSnapshot({
        req,
        read: () =>
          captureBranchReadProjectionGuard({ branchID: 'drafts', control, req, scopes: [shared] }),
      }),
    ).rejects.toThrow('Invalid or exhausted branch projection generation counter')
  })

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
