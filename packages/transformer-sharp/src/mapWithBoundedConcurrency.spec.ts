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
})
