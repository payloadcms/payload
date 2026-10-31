import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { assertBranchReadable } from '../branching/assertBranchReadable.js'
import { Forbidden } from '../errors/Forbidden.js'
import { getRequestBranch } from './getRequestBranch.js'

function createRequest() {
  return {
    context: {},
    payload: {
      config: { branching: { enabled: true } },
      find: vi.fn().mockResolvedValue({ docs: [] }),
    },
    query: {},
    user: { id: 'editor', collection: 'users' },
  } as unknown as PayloadRequest
}

describe('getRequestBranch', () => {
  it('should open main without consulting another users saved branch preference', async () => {
    const req = createRequest()

    expect(await getRequestBranch({ req })).toBe('main')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it.each(['campaign', 'main'])(
    'should resolve an explicit %s branch from the URL',
    async (branch) => {
      const req = createRequest()

      req.query.branch = branch

      expect(await getRequestBranch({ req })).toBe(branch)
    },
  )

  it('should preserve forbidden behavior for an unavailable explicit query branch', async () => {
    const req = createRequest()

    req.query.branch = 'campaign'
    req.branch = await getRequestBranch({ req })

    await expect(assertBranchReadable({ req })).rejects.toBeInstanceOf(Forbidden)
  })

  it('should ignore the query branch when branching is disabled', async () => {
    const req = createRequest()

    req.payload.config.branching.enabled = false
    req.query.branch = 'campaign'

    expect(await getRequestBranch({ req })).toBe('main')
  })
})
