import { describe, expect, it } from 'vitest'

import { mapWithBoundedConcurrency } from './mapWithBoundedConcurrency.js'

describe('mapWithBoundedConcurrency', () => {
  it('should preserve result order regardless of completion order', async () => {
    const items = [30, 10, 20]

    const results = await mapWithBoundedConcurrency(items, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return delay
    })

    expect(results).toEqual([30, 10, 20])
  })

  it('should never run more than the configured concurrency at once', async () => {
    let inFlight = 0
    let maxInFlight = 0

    await mapWithBoundedConcurrency(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 5))
        inFlight -= 1
      },
      2,
    )

    expect(maxInFlight).toBeLessThanOrEqual(2)
  })

  it('should default to a concurrency of 4', async () => {
    let inFlight = 0
    let maxInFlight = 0

    await mapWithBoundedConcurrency(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 5))
        inFlight -= 1
      },
    )

    expect(maxInFlight).toBeLessThanOrEqual(4)
  })

  it('should call the mapper exactly once per item', async () => {
    const calls: number[] = []

    await mapWithBoundedConcurrency([1, 2, 3], async (item) => {
      calls.push(item)
      return item * 2
    })

    expect(calls.sort()).toEqual([1, 2, 3])
  })

  it('should reject when any mapper call rejects', async () => {
    await expect(
      mapWithBoundedConcurrency([1, 2, 3], async (item) => {
        if (item === 2) {
          throw new Error('boom')
        }
        return item
      }),
    ).rejects.toThrow('boom')
  })

  it('should return an empty array for an empty input', async () => {
    const results = await mapWithBoundedConcurrency([], async (item) => item)
    expect(results).toEqual([])
  })
})
