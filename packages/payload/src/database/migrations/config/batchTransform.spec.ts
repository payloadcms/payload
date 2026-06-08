import { describe, expect, it, vi } from 'vitest'

import { batchTransform } from './batchTransform.js'

describe('batchTransform', () => {
  it('should call transform for every item across multiple pages', async () => {
    let page = 0
    const fetcher = vi.fn(async () => {
      page++
      if (page === 1) {
        return { docs: [{ id: '1' }, { id: '2' }], totalDocs: 3, hasNextPage: true }
      }
      return { docs: [{ id: '3' }], totalDocs: 3, hasNextPage: false }
    })
    const transform = vi.fn(async () => {})

    await batchTransform({ fetcher, transform, batchSize: 2 })

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(transform).toHaveBeenCalledTimes(3)
    expect(transform).toHaveBeenCalledWith({ id: '1' })
    expect(transform).toHaveBeenCalledWith({ id: '3' })
  })

  it('should stop when hasNextPage is false on first page', async () => {
    const fetcher = vi.fn(async () => ({
      docs: [{ id: '1' }],
      totalDocs: 1,
      hasNextPage: false,
    }))
    const transform = vi.fn(async () => {})

    await batchTransform({ fetcher, transform, batchSize: 100 })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(transform).toHaveBeenCalledTimes(1)
  })
})
