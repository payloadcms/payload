'use client'
import { describe, expect, it } from 'vitest'

import { extractRowsAndCollapsedIDs, toggleAllRows } from './rowHelpers.js'

describe('extractRowsAndCollapsedIDs', () => {
  it('should mark the given row as collapsed and return its ID', () => {
    const rows = [
      { id: 'row-1', collapsed: false },
      { id: 'row-2', collapsed: false },
    ]

    const { collapsedIDs, updatedRows } = extractRowsAndCollapsedIDs({
      collapsed: true,
      rowID: 'row-1',
      rows,
    })

    expect(collapsedIDs).toEqual(['row-1'])
    expect(updatedRows[0]?.collapsed).toBe(true)
    expect(updatedRows[1]?.collapsed).toBe(false)
  })

  it('should mark the given row as expanded and exclude its ID', () => {
    const rows = [
      { id: 'row-1', collapsed: true },
      { id: 'row-2', collapsed: true },
    ]

    const { collapsedIDs, updatedRows } = extractRowsAndCollapsedIDs({
      collapsed: false,
      rowID: 'row-1',
      rows,
    })

    expect(collapsedIDs).toEqual(['row-2'])
    expect(updatedRows[0]?.collapsed).toBe(false)
    expect(updatedRows[1]?.collapsed).toBe(true)
  })

  it('should include IDs of rows that were already collapsed', () => {
    const rows = [
      { id: 'row-1', collapsed: false },
      { id: 'row-2', collapsed: true },
      { id: 'row-3', collapsed: false },
    ]

    const { collapsedIDs } = extractRowsAndCollapsedIDs({
      collapsed: true,
      rowID: 'row-3',
      rows,
    })

    expect(collapsedIDs).toEqual(['row-2', 'row-3'])
  })
})

describe('toggleAllRows', () => {
  it('should collapse all rows and return their IDs', () => {
    const rows = [
      { id: 'row-1', collapsed: false },
      { id: 'row-2', collapsed: false },
      { id: 'row-3', collapsed: false },
    ]

    const { collapsedIDs, updatedRows } = toggleAllRows({ collapsed: true, rows })

    expect(collapsedIDs).toEqual(['row-1', 'row-2', 'row-3'])
    expect(updatedRows.every((row) => row.collapsed)).toBe(true)
  })

  it('should expand all rows and return an empty collapsed IDs list', () => {
    const rows = [
      { id: 'row-1', collapsed: true },
      { id: 'row-2', collapsed: true },
    ]

    const { collapsedIDs, updatedRows } = toggleAllRows({ collapsed: false, rows })

    expect(collapsedIDs).toEqual([])
    expect(updatedRows.every((row) => !row.collapsed)).toBe(true)
  })
})

describe('locale-aware collapsed state merging', () => {
  /**
   * This describes the merging logic used in Array/Blocks field components to
   * preserve collapsed state across locales. When a user collapses rows in one
   * locale, the IDs for the other locales must be retained in preferences.
   *
   * The merge algorithm:
   *   1. Get all current-locale row IDs (currentRowIDs).
   *   2. From preferences, keep IDs NOT in currentRowIDs (they belong to other locales).
   *   3. Append the new collapsedIDs for the current locale.
   */
  it('should preserve other-locale IDs when updating collapsed state for a locale', () => {
    // Simulate rows in the 'en' locale
    const enRows = [
      { id: 'en-row-1', collapsed: false },
      { id: 'en-row-2', collapsed: true },
    ]
    // Simulate rows in the 'de' locale that were previously collapsed and stored
    const deCollapsedIDs = ['de-row-1', 'de-row-2', 'de-row-3']

    // The previously stored preference value contains all locales' IDs mixed together
    const previousCollapsed = [...deCollapsedIDs, 'en-row-2']

    // Simulate collapsing en-row-1 (setCollapse logic)
    const { collapsedIDs: newCollapsedIDs } = extractRowsAndCollapsedIDs({
      collapsed: true,
      rowID: 'en-row-1',
      rows: enRows,
    })

    // Apply the merge
    const currentRowIDs = new Set(enRows.map((row) => row.id))
    const otherLocaleIDs = previousCollapsed.filter((id) => !currentRowIDs.has(id))
    const merged = [...otherLocaleIDs, ...newCollapsedIDs]

    // 'de' rows must be preserved; both 'en' rows should now be collapsed
    expect(merged).toContain('de-row-1')
    expect(merged).toContain('de-row-2')
    expect(merged).toContain('de-row-3')
    expect(merged).toContain('en-row-1')
    expect(merged).toContain('en-row-2')
    expect(merged).toHaveLength(5)
  })

  it('should not duplicate other-locale IDs on repeated collapses in same locale', () => {
    const enRows = [
      { id: 'en-row-1', collapsed: false },
      { id: 'en-row-2', collapsed: false },
    ]
    // After a previous toggle-all-collapse for 'en', both en rows and de rows are stored
    const previousCollapsed = ['de-row-1', 'en-row-1', 'en-row-2']

    // Now user expands all in 'en'
    const { collapsedIDs: newCollapsedIDs } = toggleAllRows({ collapsed: false, rows: enRows })

    const currentRowIDs = new Set(enRows.map((row) => row.id))
    const otherLocaleIDs = previousCollapsed.filter((id) => !currentRowIDs.has(id))
    const merged = [...otherLocaleIDs, ...newCollapsedIDs]

    // 'de' rows should still be present; en rows should not be (all expanded)
    expect(merged).toContain('de-row-1')
    expect(merged).not.toContain('en-row-1')
    expect(merged).not.toContain('en-row-2')
    expect(merged).toHaveLength(1)
  })
})
