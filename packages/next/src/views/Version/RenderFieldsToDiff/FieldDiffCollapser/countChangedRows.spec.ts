import { countChangedRows } from './countChangedRows.js'

describe('countChangedRows', () => {
  it('should return 0 when both comparison and version are empty arrays', () => {
    const result = countChangedRows({ comparison: [], version: [] })
    expect(result).toBe(0)
  })

  it('should return 1 when 1 row has changed', () => {
    const comparison = [1, 2, 3]
    const version = [1, 2, 4]

    const result = countChangedRows({ comparison, version })
    expect(result).toBe(1)
  })

  it('should count all rows when all are changed', () => {
    const comparison = [1, 2, 3]
    const version = [4, 5, 6]

    const result = countChangedRows({ comparison, version })
    expect(result).toBe(3)
  })

  it('should handle different lengths of comparison and version', () => {
    const comparison = [1, 2]
    const version = [1, 2, 3]

    const result = countChangedRows({ comparison, version })
    expect(result).toBe(1)
  })

  it('should return 0 when both comparison and version are undefined', () => {
    const result = countChangedRows({})
    expect(result).toBe(0)
  })

  it('should count all rows when version is undefined', () => {
    const comparison = [1, 2, 3]
    const version = undefined

    const result = countChangedRows({ comparison, version })
    expect(result).toBe(3)
  })

  it('should count all rows when comparison is undefined', () => {
    const comparison = undefined
    const version = [1, 2, 3]

    const result = countChangedRows({ comparison, version })
    expect(result).toBe(3)
  })
})
