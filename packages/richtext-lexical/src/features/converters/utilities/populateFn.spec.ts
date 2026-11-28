import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPayloadPopulateFn } from './payloadPopulateFn.js'
import { getRestPopulateFn } from './restPopulateFn.js'

const createRequest = ({ loadedDoc }: { loadedDoc: null | object }): PayloadRequest =>
  ({
    payloadDataLoader: { load: vi.fn().mockResolvedValue(loadedDoc) },
  }) as unknown as PayloadRequest

describe('getPayloadPopulateFn', () => {
  it('should resolve the document', async () => {
    const populate = await getPayloadPopulateFn({
      currentDepth: 0,
      depth: 1,
      req: createRequest({ loadedDoc: { id: 1, slug: 'about' } }),
    })

    expect(await populate({ id: 1, collectionSlug: 'pages' })).toEqual({ id: 1, slug: 'about' })
  })

  it('should resolve undefined for a missing or unreadable document', async () => {
    const populate = await getPayloadPopulateFn({
      currentDepth: 0,
      depth: 1,
      req: createRequest({ loadedDoc: null }),
    })

    expect(await populate({ id: 1, collectionSlug: 'pages' })).toBeUndefined()
  })
})

describe('getRestPopulateFn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should resolve the document', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(Response.json({ id: 1, slug: 'about' }))

    const populate = getRestPopulateFn({ apiURL: 'http://localhost:3000/api' })

    expect(await populate({ id: 1, collectionSlug: 'pages' })).toEqual({ id: 1, slug: 'about' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/api/pages/1?depth=0&draft=false',
    )
  })

  it('should resolve undefined instead of the error body for a missing or unreadable document', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({ errors: [{ message: 'Not Found' }] }, { status: 404 }),
    )

    const populate = getRestPopulateFn({ apiURL: 'http://localhost:3000/api' })

    expect(await populate({ id: 1, collectionSlug: 'pages' })).toBeUndefined()
  })
})
