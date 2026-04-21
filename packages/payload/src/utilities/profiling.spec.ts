import { describe, expect, it } from 'vitest'

import {
  clearProfiles,
  getProfileResults,
  printProfileResults,
  timeAsync,
  timeSync,
} from './profiling.js'

describe('Profiling Utilities', () => {
  it('should time synchronous functions', () => {
    clearProfiles()

    const result = timeSync('syncOperation', () => {
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    })

    expect(result).toBe(499500)

    const results = getProfileResults()
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('syncOperation')
    expect(results[0]?.calls).toBe(1)
    expect(results[0]?.duration).toBeGreaterThanOrEqual(0)
  })

  it('should time async functions', async () => {
    clearProfiles()

    const result = await timeAsync('asyncOperation', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return 'done'
    })

    expect(result).toBe('done')

    const results = getProfileResults()
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('asyncOperation')
    expect(results[0]?.calls).toBe(1)
    expect(results[0]?.duration).toBeGreaterThanOrEqual(9)
  })

  it('should accumulate multiple calls', () => {
    clearProfiles()

    for (let i = 0; i < 5; i++) {
      timeSync('repeatedOperation', () => i * 2)
    }

    const results = getProfileResults()
    expect(results).toHaveLength(1)
    expect(results[0]?.calls).toBe(5)
  })

  it('should print profile results', () => {
    clearProfiles()

    timeSync('operation1', () => 'a')
    timeSync('operation2', () => 'b')

    // Just ensure it doesn't throw
    printProfileResults()

    const results = getProfileResults()
    expect(results).toHaveLength(2)
  })
})
