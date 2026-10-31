import type { PayloadRequest } from 'payload'

import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { RenderBranchProvider } from './index.server.js'

vi.mock('../../exports/client/index.js', () => ({ BranchProvider: () => null }))

describe('RenderBranchProvider', () => {
  it.each(['payload-branches', 'payload-jobs'])(
    'should preserve the rendered branch when %s lookup fails',
    async (failedCollection) => {
      const req = {
        branch: 'feature',
        payload: {
          config: { branching: { enabled: true } },
          find: vi.fn(async ({ collection }) => {
            if (collection === failedCollection) {
              throw new Error('Lookup failed')
            }
            return { docs: [{ id: 'branch-1', name: 'Feature', slug: 'feature' }] }
          }),
        },
        user: { id: 'editor', collection: 'users' },
      } as unknown as PayloadRequest

      const result = await RenderBranchProvider({ children: null, req })

      expect(React.isValidElement(result)).toBe(true)
      if (React.isValidElement<{ activeBranch: string; branches: unknown[] }>(result)) {
        expect(result.props.activeBranch).toBe('feature')
        expect(result.props.branches).toHaveLength(failedCollection === 'payload-jobs' ? 1 : 0)
      }
    },
  )
})
