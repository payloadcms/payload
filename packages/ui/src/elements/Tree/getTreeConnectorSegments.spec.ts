import { describe, expect, it } from 'vitest'

import type { TreePosition } from './types.js'

import { getTreeConnectorSegments } from './getTreeConnectorSegments.js'

const position = (overrides: Partial<TreePosition> = {}): TreePosition => ({
  ancestorContinues: [],
  indent: 0,
  isLastRendered: false,
  isLastSibling: false,
  ...overrides,
})

describe('tree connector segments', () => {
  it('should keep the same horizontal arm when a branch opens', () => {
    const closed = getTreeConnectorSegments({ hasChildren: true, position: position() })
    const open = getTreeConnectorSegments({
      hasChildren: true,
      isExpanded: true,
      position: position(),
    })

    expect(closed.hasHorizontalConnector).toBe(true)
    expect(open.hasHorizontalConnector).toBe(true)
    expect(closed.outgoing).toBe('solid')
    expect(open.outgoing).toBe('ghost')
    expect(closed.hasChildStem).toBe(false)
    expect(open.hasChildStem).toBe(true)
  })

  it('should stop the final sibling with an L while preserving its child stem', () => {
    const segments = getTreeConnectorSegments({
      hasChildren: true,
      isExpanded: true,
      position: position({ isLastSibling: true }),
    })

    expect(segments.outgoing).toBe('none')
    expect(segments.hasHorizontalConnector).toBe(true)
    expect(segments.hasChildStem).toBe(true)
  })

  it('should connect expanded virtual groups through the disclosure without adding indentation', () => {
    const segments = getTreeConnectorSegments({
      hasChildren: true,
      isExpanded: true,
      position: position({ ancestorContinues: [true], indent: 1, isLastSibling: true }),
      variant: 'group',
    })

    expect(segments.ancestorColumns).toEqual([0])
    expect(segments.outgoing).toBe('solid')
    expect(segments.hasHorizontalConnector).toBe(false)
    expect(segments.hasChildStem).toBe(false)
  })

  it('should terminate a collapsed final virtual group at the disclosure', () => {
    expect(
      getTreeConnectorSegments({
        hasChildren: true,
        position: position({ isLastSibling: true }),
        variant: 'group',
      }).outgoing,
    ).toBe('none')
  })

  it('should draw only continuing ancestors, including the root column', () => {
    const segments = getTreeConnectorSegments({
      position: position({ ancestorContinues: [true, false, true], indent: 3 }),
    })

    expect(segments.ancestorColumns).toEqual([0, 2])
    expect(segments.outgoing).toBe('solid')
  })

  it('should stop every rail at the midpoint of the final rendered row', () => {
    const segments = getTreeConnectorSegments({
      hasChildren: true,
      isExpanded: true,
      position: position({ ancestorContinues: [true], indent: 1, isLastRendered: true }),
    })

    expect(segments.ancestorColumns).toEqual([0])
    expect(segments.outgoing).toBe('none')
    expect(segments.hasChildStem).toBe(false)
    expect(segments.shouldTerminateAncestors).toBe(true)
  })

  it('should keep continuation rows attached to the branch without a child stem', () => {
    const segments = getTreeConnectorSegments({
      position: position({ ancestorContinues: [false], indent: 1, isLastSibling: true }),
      variant: 'continuation',
    })

    expect(segments.ancestorColumns).toEqual([])
    expect(segments.hasHorizontalConnector).toBe(true)
    expect(segments.outgoing).toBe('none')
    expect(segments.hasChildStem).toBe(false)
  })
})
