import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { collectBranchReadGraph } from './collectBranchReadGraph.js'

describe('branch raw read graph', () => {
  it('should retain typed identities, negative entries and isolated raw values', async () => {
    const req = {
      payload: { db: { branching: { withReadSnapshot: ({ read, req }) => read({ req }) } } },
    } as unknown as PayloadRequest
    const { graph } = await collectBranchReadGraph({
      branchID: 'drafts',
      read: async ({ remember }) => {
        remember({ collection: 'posts', doc: { id: 1, title: 'number' }, id: 1 })
        remember({ collection: 'posts', doc: { id: '1', title: 'string' }, id: '1' })
        remember({ collection: 'posts', doc: null, id: 2 })
        return undefined
      },
      req,
    })

    expect(graph.get({ collection: 'posts', id: 1 })).toEqual({ id: 1, title: 'number' })
    expect(graph.get({ collection: 'posts', id: '1' })).toEqual({ id: '1', title: 'string' })
    expect(graph.get({ collection: 'posts', id: 2 })).toBeNull()
    graph.get({ collection: 'posts', id: 1 })!.title = 'mutated'
    expect(graph.get({ collection: 'posts', id: 1 })!.title).toBe('number')
    expect(() => graph.get({ collection: 'posts', id: 3 })).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
  })

  it('should expose no graph when atomic validation rejects and never retry callbacks', async () => {
    const read = vi.fn(async ({ remember }) => {
      remember({ collection: 'posts', doc: null, id: 1 })
      return 'raw'
    })
    const req = {
      payload: {
        db: {
          branching: {
            withReadSnapshot: async ({ read, req }) => {
              await read({ req })
              throw new Error('conflict')
            },
          },
        },
      },
    } as unknown as PayloadRequest

    await expect(collectBranchReadGraph({ branchID: 'drafts', read, req })).rejects.toThrow(
      'conflict',
    )
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('should isolate borrowed input mutations and every read of transferred native rows', async () => {
    const shared = { title: 'original' }
    const borrowed = { id: 1, first: shared, second: shared }
    const date = new Date('2026-01-01T00:00:00.000Z')
    const value = { date, missing: undefined, bytes: Buffer.from([1, 2]) }
    const owned = {
      id: 2,
      opaque: { first: value, second: value, map: new Map([['entry', value]]) },
    }
    const req = {
      payload: { db: { branching: { withReadSnapshot: ({ read, req }) => read({ req }) } } },
    } as unknown as PayloadRequest
    const { graph } = await collectBranchReadGraph({
      branchID: 'drafts',
      read: async ({ remember, rememberOwned }) => {
        remember({ collection: 'posts', doc: borrowed, id: 1 })
        rememberOwned({ collection: 'posts', doc: owned, id: 2 })
        borrowed.first.title = 'changed by callback'
      },
      req,
    })
    const borrowedRead = graph.get({ collection: 'posts', id: 1 })! as typeof borrowed
    const ownedRead = graph.get({ collection: 'posts', id: 2 })! as typeof owned

    expect(borrowedRead.first.title).toBe('original')
    expect(borrowedRead.first).toBe(borrowedRead.second)
    expect(ownedRead.opaque.first).toBe(ownedRead.opaque.second)
    expect(ownedRead.opaque.map.get('entry')).toBe(ownedRead.opaque.first)
    expect(Object.hasOwn(ownedRead.opaque.first, 'missing')).toBe(true)
    expect(ownedRead.opaque.first.date).toEqual(date)
    expect(ownedRead.opaque.first.bytes).toEqual(new Uint8Array([1, 2]))
    ownedRead.opaque.first.date.setUTCFullYear(2000)
    ownedRead.opaque.first.bytes[0] = 9
    ownedRead.opaque.map.clear()
    expect(graph.get({ collection: 'posts', id: 2 })).toEqual(structuredClone(owned))
  })

  it('should revoke borrowed and owned callbacks after success or failure', async () => {
    for (const shouldFail of [false, true]) {
      let rememberLater: (() => void) | undefined
      let rememberOwnedLater: (() => void) | undefined
      const req = {
        payload: {
          db: {
            branching: {
              withReadSnapshot: async ({ read, req }) => {
                const result = await read({ req })

                if (shouldFail) throw new Error('validation failed')
                return result
              },
            },
          },
        },
      } as unknown as PayloadRequest
      const collected = collectBranchReadGraph({
        branchID: 'drafts',
        read: async ({ remember, rememberOwned }) => {
          rememberLater = () => remember({ collection: 'posts', doc: null, id: 1 })
          rememberOwnedLater = () => rememberOwned({ collection: 'posts', doc: null, id: 2 })
        },
        req,
      })

      if (shouldFail) {
        await expect(collected).rejects.toThrow('validation failed')
      } else {
        await collected
      }
      for (const remember of [rememberLater, rememberOwnedLater]) {
        expect(remember).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
      }
    }
  })

  it('should apply the same coordinate, duplicate and byte budgets to transferred rows', async () => {
    const req = {
      payload: { db: { branching: { withReadSnapshot: ({ read, req }) => read({ req }) } } },
    } as unknown as PayloadRequest

    await expect(
      collectBranchReadGraph({
        branchID: 'drafts',
        read: async ({ remember, rememberOwned }) => {
          remember({ collection: 'posts', doc: { id: 1, title: 'first' }, id: 1 })
          rememberOwned({ collection: 'posts', doc: { id: 1, title: 'different' }, id: 1 })
        },
        req,
      }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    await expect(
      collectBranchReadGraph({
        branchID: 'drafts',
        read: async ({ rememberOwned }) => {
          rememberOwned({
            collection: 'posts',
            doc: { id: 1, title: 'x'.repeat(16 * 1024 * 1024) },
            id: 1,
          })
        },
        req,
      }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    await expect(
      collectBranchReadGraph({
        branchID: 'drafts',
        read: async ({ rememberOwned }) => {
          for (let id = 0; id <= 10_000; id++) {
            rememberOwned({ collection: 'posts', doc: null, id })
          }
        },
        req,
      }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
  })
})
