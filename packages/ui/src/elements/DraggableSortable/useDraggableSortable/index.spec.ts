import { describe, expect, it, vi } from 'vitest'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    active: { id: 'col-0' },
    activeIndex: 0,
    attributes: { 'aria-pressed': false },
    index: 2,
    isDragging: false,
    isOver: true,
    isSorting: true,
    listeners: {},
    over: { id: 'col-2' },
    overIndex: 2,
    setActivatorNodeRef: vi.fn(),
    setNodeRef: vi.fn(),
    transform: { scaleX: 1, scaleY: 1, x: 0, y: 50 },
    transition: 'transform 250ms ease',
  })),
}))

import { useDraggableSortable } from './index.js'

describe('useDraggableSortable', () => {
  it('returns activeIndex, index, and overIndex from useSortable', () => {
    const result = useDraggableSortable({ id: 'col-2' })

    expect(result.activeIndex).toBe(0)
    expect(result.index).toBe(2)
    expect(result.overIndex).toBe(2)
    expect(result.isOver).toBe(true)
    expect(result.isSorting).toBe(true)
    expect(result.isDragging).toBe(false)
    expect(result.transform).toBe('translate3d(0px, 50px, 0)')
  })
})

