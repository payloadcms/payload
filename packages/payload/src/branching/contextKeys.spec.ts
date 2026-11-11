import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { captureSavedVersionIDContextKey } from '../versions/saveVersion.js'
import { setBranchDeleteOperation, setConcurrentBranchDelete } from './tombstone.js'

describe('branching request context keys', () => {
  it('should share the saved version key between module copies', () => {
    expect(Symbol.keyFor(captureSavedVersionIDContextKey)).toBe(
      'payload.versions.captureSavedVersionID',
    )
  })

  it('should share the branch delete key between module copies', () => {
    const req = { context: {} } as PayloadRequest

    setBranchDeleteOperation({
      branch: 'preview',
      collectionSlug: 'pages',
      docID: '1',
      isTombstoneExpected: true,
      onResolved: vi.fn(),
      req,
      useAmbientTransaction: true,
    })

    const [contextKey] = Object.getOwnPropertySymbols(req.context)

    expect(Symbol.keyFor(contextKey!)).toBe('payload.branching.branchDeleteOperation')
  })

  it('should share the concurrent branch delete key between module copies', () => {
    const req = { context: {} } as PayloadRequest

    setConcurrentBranchDelete({
      branch: 'preview',
      collectionSlug: 'pages',
      doc: { id: '1' },
      docID: '1',
      req,
      retryError: new Error('retry'),
      winnerID: '2',
    })

    const [contextKey] = Object.getOwnPropertySymbols(req.context)

    expect(Symbol.keyFor(contextKey!)).toBe('payload.branching.concurrentBranchDelete')
  })
})
