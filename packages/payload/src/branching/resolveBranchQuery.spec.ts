import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { resolveBranch } from './resolveBranch.js'
import { resolveBranchReadState } from './resolveBranchQuery.js'

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
