import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'
import type { Payload } from '../../../index.js'

vi.mock('../find.js', () => {
  return {
    findOperation: vi.fn(async (args) => args),
  }
})

vi.mock('../../../utilities/createLocalReq.js', () => {
  return {
    createLocalReq: vi.fn(async (options) => {
      const req = options.req as PayloadRequest
      return {
        ...req,
        query: {
          ...(req?.query || {}),
          depth: options.depth,
        },
      } as PayloadRequest
    }),
  }
})

import { findOperation } from '../find.js'
import { findLocal } from './find.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'

const mockPayload = {
  collections: {
    posts: {
      config: {
        slug: 'posts',
      },
    },
  },
} as unknown as Payload

describe('findLocal depth handling', () => {
  it('passes depth option to request if set', async () => {
    const result = await findLocal(mockPayload, {
      collection: 'posts',
      depth: 7,
    } as any)

    const mockedCreateLocalReq = vi.mocked(createLocalReq)
    const mockedFindOperation = vi.mocked(findOperation)

    expect(mockedCreateLocalReq).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 7 }),
      mockPayload,
    )
    expect(mockedFindOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 7,
        req: expect.objectContaining({
          query: expect.objectContaining({ depth: 7 }),
        }),
      }),
    )

    expect(result.depth).toBe(7)
    expect(result.req.query.depth).toBe(7)
  })

  it('does not set depth on request if option not set', async () => {
    const result = await findLocal(mockPayload, {
      collection: 'posts',
    } as any)
    expect(result.req.query?.depth).toBe(undefined)
  })

  it('always uses depth option for request even if manually set', async () => {
    const req = { query: { depth: 9 } } as Partial<PayloadRequest>

    const result = await findLocal(mockPayload, {
      collection: 'posts',
      depth: 3,
      req,
    } as any)

    const mockedCreateLocalReq = vi.mocked(createLocalReq)
    const mockedFindOperation = vi.mocked(findOperation)

    expect(mockedCreateLocalReq).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 3 }),
      mockPayload,
    )
    expect(mockedFindOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 3,
        req: expect.objectContaining({
          query: expect.objectContaining({ depth: 3 }),
        }),
      }),
    )
    expect(result.depth).toBe(3)
    expect(result.req.query.depth).toBe(3)
  })

  it('removes manually set req.query.depth', async () => {
    const req = { query: { depth: 9, test: 'test' }, test2: 'test2' } as Partial<PayloadRequest>

    const result = await findLocal(mockPayload, {
      collection: 'posts',
      req,
    } as any)

    expect(result.req.query.depth).toBe(undefined)
  })

  it('retains other req param passed', async () => {
    const req = { query: { depth: 9, test: 'test' }, test2: 'test2' } as Partial<PayloadRequest>

    const result = await findLocal(mockPayload, {
      collection: 'posts',
      depth: 3,
      req,
    } as any)

    const mockedCreateLocalReq = vi.mocked(createLocalReq)
    const mockedFindOperation = vi.mocked(findOperation)

    expect(mockedCreateLocalReq).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 3 }),
      mockPayload,
    )
    expect(mockedFindOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 3,
        req: expect.objectContaining({
          query: expect.objectContaining({ depth: 3 }),
        }),
      }),
    )
    expect(result.depth).toBe(3)
    expect(result.req.query.depth).toBe(3)
    expect(result.req.query.test).toBe('test')
    expect(result.req.test2).toBe('test2')
  })
})
