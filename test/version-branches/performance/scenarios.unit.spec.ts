import { describe, expect, test } from 'vitest'

import {
  buildPerformanceData,
  getPerformanceIterations,
  getPerformanceSampleOrdinals,
  hasPerformanceOverride,
  summarizePerformanceSamples,
} from './scenarios.js'

const scenario = { branches: 20, documents: 100_000, locales: 10, overrideDensity: 0.01 }

describe('Branch query benchmark distribution', () => {
  test('should verify a distinct center-heavy record and retain native block names in common input', () => {
    expect(getPerformanceSampleOrdinals({ scenario })).toEqual([0, 1, 50_000, 99_999])
    expect(getPerformanceSampleOrdinals({ scenario: { ...scenario, documents: 10_000 } })).toEqual([
      0, 1, 5000, 9999,
    ])
    const inherited = buildPerformanceData({ ordinal: 5000, scenario })
    const owned = buildPerformanceData({ hasOverride: true, ordinal: 5000, scenario })

    expect(inherited.content).toMatchObject([{ blockName: null }])
    expect(owned.content).toMatchObject([{ blockName: null }])
  })
  test('should reject undersampled or invalid final runs before loading fixtures', () => {
    expect(getPerformanceIterations({ evidence: 'final' })).toBe(40)
    expect(getPerformanceIterations({ evidence: 'final', value: '100' })).toBe(100)
    expect(getPerformanceIterations({ evidence: 'diagnostic', value: '1' })).toBe(1)
    for (const value of ['1', '39', '40.5', 'NaN', 'Infinity']) {
      expect(() => getPerformanceIterations({ evidence: 'final', value })).toThrow()
    }
  })

  test('should represent sparse overrides and a heavy one-percent content subset exactly', () => {
    let overrides = 0
    let heavy = 0
    let edges = 0

    for (let ordinal = 0; ordinal < 10_000; ordinal++) {
      overrides += Number(hasPerformanceOverride({ ordinal, scenario }))
      const data = buildPerformanceData({ ordinal, scenario })

      heavy += Number((data.content as unknown[]).length > 0)
      edges += (data.related as unknown[]).length
    }
    expect(overrides).toBe(100)
    expect(heavy).toBe(100)
    expect(edges).toBe(13_100)
    const inherited = buildPerformanceData({ ordinal: 0, scenario })
    const owned = buildPerformanceData({ hasOverride: true, ordinal: 0, scenario })

    expect(Object.keys(inherited.title!)).toHaveLength(10)
    expect(inherited.related).toContain(inherited.id)
    expect(owned._status).toMatchObject({ en: 'published', fr: 'draft' })
    expect((owned.title as Record<string, string>).fr).toContain('-review')
  })

  test('should retain outliers in nearest-rank p95 measurements', () => {
    expect(
      summarizePerformanceSamples({ samples: [...Array.from({ length: 19 }, () => 1), 100] }),
    ).toEqual({ p50: 1, p95: 1 })
    expect(summarizePerformanceSamples({ samples: [1, 10, 100] })).toEqual({ p50: 10, p95: 100 })
    expect(() => summarizePerformanceSamples({ samples: [] })).toThrow()
  })
})
