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
})
