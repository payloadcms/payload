import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { assertBranchReadable } from '../branching/assertBranchReadable.js'
import { Forbidden } from '../errors/Forbidden.js'
import { getRequestBranch } from './getRequestBranch.js'

function createRequest({ url }: { url?: string } = {}) {
  return {
    context: {},
    payload: {
      config: { branching: { enabled: true } },
      find: vi.fn().mockResolvedValue({ docs: [] }),
    },
    query: {},
    server: {
      redirect: vi.fn(() => {
        throw new Error('redirect')
      }),
    },
    url,
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

  it('should preserve the access check if branch access changes after resolution', async () => {
    const req = createRequest({ url: 'http://localhost/admin?branch=campaign' })

    req.query.branch = 'campaign'
    vi.mocked(req.payload.find)
      .mockResolvedValueOnce({ docs: [{ id: 'campaign-id' }] } as never)
      .mockResolvedValueOnce({ docs: [] } as never)
    req.branch = await getRequestBranch({ req })

    await expect(assertBranchReadable({ req })).rejects.toBeInstanceOf(Forbidden)
  })

  it('should redirect a missing branch to main while preserving the rest of the URL', async () => {
    const req = createRequest({
      url: 'http://localhost/admin/collections/posts?branch=deleted&locale=fr&page=2',
    })
    const redirect = vi.fn(() => {
      throw new Error('redirect')
    })

    req.query.branch = 'deleted'
    req.server = { redirect } as unknown as PayloadRequest['server']

    await expect(getRequestBranch({ req })).rejects.toThrow('redirect')
    expect(redirect).toHaveBeenCalledWith('/admin/collections/posts?locale=fr&page=2')
    expect(req.payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'payload-branches',
        overrideAccess: false,
        where: { name: { equals: 'deleted' } },
      }),
    )
  })

  it('should keep anonymous branch requests subject to the access check', async () => {
    const req = createRequest({ url: 'http://localhost/admin?branch=deleted' })

    req.query.branch = 'deleted'
    req.user = null

    req.branch = await getRequestBranch({ req })

    expect(req.payload.find).not.toHaveBeenCalled()
    await expect(assertBranchReadable({ req })).rejects.toBeInstanceOf(Forbidden)
  })

  it('should preserve the requested branch when no server adapter can redirect', async () => {
    const req = createRequest({ url: 'http://localhost/admin?branch=campaign' })

    req.query.branch = 'campaign'
    req.server = undefined

    expect(await getRequestBranch({ req })).toBe('campaign')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('should ignore the query branch when branching is disabled', async () => {
    const req = createRequest()

    req.payload.config.branching.enabled = false
    req.query.branch = 'campaign'

    expect(await getRequestBranch({ req })).toBe('main')
  })
})
