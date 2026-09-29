import { describe, expect, it } from 'vitest'

import { createHierarchySelections, selectHierarchyItem } from './selection.js'

const path = [{ id: 0, title: 'Root' }]

describe('hierarchy modal selection contract', () => {
  it('should preserve numeric zero as a multi-selection', () => {
    const selections = createHierarchySelections({ hasMany: true, initialSelections: [0] })

    expect(Array.from(selections.keys())).toEqual([0])
  })

  it('should replace a single selection instead of toggling it off', () => {
    const selected = selectHierarchyItem({
      current: new Map(),
      hasMany: false,
      id: 0,
      path,
    })
    const reselected = selectHierarchyItem({ current: selected, hasMany: false, id: 0, path })

    expect(Array.from(reselected.keys())).toEqual([0])
  })

  it('should allow multi-selection to be explicitly cleared before confirming', () => {
    const selected = selectHierarchyItem({ current: new Map(), hasMany: true, id: 1, path })
    const cleared = selectHierarchyItem({ current: selected, hasMany: true, id: 1, path })

    expect(cleared).toEqual(new Map())
  })

  it('should restore the original multi-selection on cancel', () => {
    const original = createHierarchySelections({ hasMany: true, initialSelections: [0, 2] })
    const changed = selectHierarchyItem({ current: original, hasMany: true, id: 2, path })
    const restored = createHierarchySelections({ hasMany: true, initialSelections: [0, 2] })

    expect(changed).not.toEqual(original)
    expect(restored).toEqual(original)
  })
})
