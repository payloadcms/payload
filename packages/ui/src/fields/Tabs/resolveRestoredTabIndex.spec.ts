import { describe, expect, it } from 'vitest'

import { resolveRestoredTabIndex } from './resolveRestoredTabIndex.js'

describe('resolveRestoredTabIndex', () => {
  it('should restore a stored index that is within range', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: 2, tabCount: 5 })).toBe(2)
  })

  it('should restore the first tab when it is the stored index', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: 0, tabCount: 5 })).toBe(0)
  })

  it('should restore nothing when no index is stored', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: undefined, tabCount: 5 })).toBeUndefined()
  })

  it('should restore nothing when the stored index is null', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: null, tabCount: 5 })).toBeUndefined()
  })

  it('should restore nothing when the stored index is not a number', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: '2', tabCount: 5 })).toBeUndefined()
  })

  it('should restore nothing when the stored index exceeds the tab count', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: 5, tabCount: 5 })).toBeUndefined()
  })

  it('should restore nothing when the stored index is negative', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: -1, tabCount: 5 })).toBeUndefined()
  })

  it('should restore nothing when there are no tabs', () => {
    expect(resolveRestoredTabIndex({ storedTabIndex: 0, tabCount: 0 })).toBeUndefined()
  })
})
