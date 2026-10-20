import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { resolveBranch } from './resolveBranch.js'
import { resolveBranchQuery, resolveBranchReadState } from './resolveBranchQuery.js'

describe('resolveBranchQuery', () => {
  it('should preserve fallback visibility for more than 2000 shadowed documents', async () => {
    const shadowedIDs = Array.from({ length: 2001 }, (_, index) => index + 1)
    const deletedID = shadowedIDs[2000]!
    const find = vi.fn().mockResolvedValue({
      docs: shadowedIDs.map((id) => ({
        collectionSlug: 'posts',
        doc: { value: id },
        operation: id === deletedID ? 'delete' : 'update',
      })),
    })
    const req = {
      branch: 'campaign',
      context: {},
      payload: {
        config: {
          branching: {
            branchableCollections: new Set(['posts']),
            branchableGlobals: new Set(),
            enabled: true,
          },
        },
        db: { find },
      },
    } as unknown as PayloadRequest

    const where = await resolveBranchQuery({ collectionSlug: 'posts', req, where: {} })

    expect(where).toEqual({
      and: [
        {
          or: [
            {
              and: [
                { _branch: { equals: 'campaign' } },
                {
                  or: [
                    { _branchDocID: { not_in: [deletedID] } },
                    { _branchDocID: { equals: null } },
                  ],
                },
              ],
            },
            {
              and: [{ _branch: { equals: 'main' } }, { id: { not_in: shadowedIDs } }],
            },
          ],
        },
      ],
    })
    expect(find).toHaveBeenCalledTimes(1)
  })
})

describe('resolveBranchReadState', () => {
  it('should not initialise branch state when reading a non-branchable collection', () => {
    const req = {
      context: {},
      payload: {
        config: {
          branching: {
            branchableCollections: new Set(['posts']),
            branchableGlobals: new Set(),
            enabled: true,
          },
        },
      },
    } as PayloadRequest

    const preferenceReadState = resolveBranchReadState({
      collectionSlug: 'payload-preferences',
      req,
    })

    expect(preferenceReadState.useBranching).toBe(false)

    req.branch = 'halloween-updates'

    expect(resolveBranch(req)).toBe('halloween-updates')
  })

  it('should identify a bypassed request as main without caching branch state', () => {
    const req = {
      context: { _branchBypass: true },
      payload: {
        config: {
          branching: {
            branchableCollections: new Set(['posts']),
            branchableGlobals: new Set(),
            enabled: true,
          },
        },
      },
      query: { branch: 'halloween-updates' },
    } as PayloadRequest

    const bypassedReadState = resolveBranchReadState({ collectionSlug: 'posts', req })

    expect(bypassedReadState).toEqual({ branch: 'main', useBranching: false })
    expect(req.branch).toBe('main')

    delete (req.context as Record<string, unknown>)._branchBypass
    req.branch = 'christmas-updates'

    expect(resolveBranch(req)).toBe('christmas-updates')
  })
})
