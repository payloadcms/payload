import type { KeyboardCoordinateGetter, KeyboardSensorOptions } from '@dnd-kit/core'

import {
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

type DroppablePosition = {
  centerX: number
  centerY: number
  element: Element
  isBeforeDroppable: boolean
  rect: DOMRect
  row: number
}

/**
 * Get all droppable widget positions, filtering out overlapping "before" droppables
 * and assigning row numbers based on Y position.
 */
function getDroppablePositions(): DroppablePosition[] {
  const positionTolerance = 5
  const rowTolerance = 10
  const result: DroppablePosition[] = []
  let currentRow = 0
  let currentY: null | number = null

  const allDroppables = Array.from(document.querySelectorAll('.droppable-widget'))

  for (let i = 0; i < allDroppables.length; i++) {
    const element = allDroppables[i]
    const rect = element.getBoundingClientRect()

    // Skip hidden elements
    if (rect.width === 0 || rect.height === 0) {
      continue
    }

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const testId = element.getAttribute('data-testid') || ''
    const isBeforeDroppable = testId.endsWith('-before')

    // Skip "before" droppables that overlap with another droppable
    if (isBeforeDroppable) {
      const hasOverlapping = allDroppables.some((other, otherIndex) => {
        if (otherIndex === i) {
          return false
        }
        const otherRect = other.getBoundingClientRect()
        const otherCenterX = otherRect.left + otherRect.width / 2
        const otherCenterY = otherRect.top + otherRect.height / 2
        return (
          Math.abs(otherCenterX - centerX) < positionTolerance &&
          Math.abs(otherCenterY - centerY) < positionTolerance
        )
      })
      if (hasOverlapping) {
        continue
      }
    }

    // Assign row number based on Y position change
    if (currentY === null) {
      currentY = centerY
    } else if (Math.abs(centerY - currentY) >= rowTolerance) {
      currentRow++
      currentY = centerY
    }

    result.push({
      centerX,
      centerY,
      element,
      isBeforeDroppable,
      rect,
      row: currentRow,
    })
  }

  return result
}

/**
 * Find the row with the closest Y position to the given posY.
 * Returns the row index, or null if no droppables exist.
 */
function findClosestRow(droppables: DroppablePosition[], posY: number): null | number {
  if (droppables.length === 0) {
    return null
  }

  let closestRow = droppables[0].row
  let minYDistance = Infinity

  for (const droppable of droppables) {
    const yDistance = Math.abs(droppable.centerY - posY)
    if (yDistance < minYDistance) {
      minYDistance = yDistance
      closestRow = droppable.row
    }
  }

  return closestRow
}

/**
 * Find the closest droppable within a specific row by X position.
 * Returns the droppable and its index, or null if no droppables in that row.
 */
function findClosestDroppableInRow(
  droppables: DroppablePosition[],
  rowIndex: number,
  posX: number,
): { droppable: DroppablePosition; index: number } | null {
  let closestIndex = -1
  let minXDistance = Infinity

  for (let i = 0; i < droppables.length; i++) {
    const droppable = droppables[i]
    if (droppable.row === rowIndex) {
      const xDistance = Math.abs(droppable.centerX - posX)
      if (xDistance < minXDistance) {
        minXDistance = xDistance
        closestIndex = i
      }
    }
  }

  if (closestIndex === -1) {
    return null
  }

  return { droppable: droppables[closestIndex], index: closestIndex }
}

/**
 * Find the target droppable based on direction
 * - ArrowRight/Left: Next/previous in DOM order (now that overlapping droppables are filtered)
 * - ArrowUp/Down: Closest in adjacent row (row +1 or -1) by X position
 */
function findTargetDroppable(
  droppables: DroppablePosition[],
  currentCenterX: number,
  currentCenterY: number,
  direction: string,
): DroppablePosition | null {
  // Find the closest row, then the closest droppable in that row
  const currentRow = findClosestRow(droppables, currentCenterY)

  if (currentRow === null) {
    return null
  }

  const currentDroppable = findClosestDroppableInRow(droppables, currentRow, currentCenterX)

  if (!currentDroppable) {
    return null
  }

  const { index: currentIndex } = currentDroppable

  switch (direction) {
    case 'ArrowDown': {
      const targetRow = currentRow + 1
      return findClosestDroppableInRow(droppables, targetRow, currentCenterX)?.droppable || null
    }

    case 'ArrowLeft':
      // Previous in DOM order
      return droppables[currentIndex - 1] || null

    case 'ArrowRight':
      // Next in DOM order
      return droppables[currentIndex + 1] || null

    case 'ArrowUp': {
      const targetRow = currentRow - 1
      return findClosestDroppableInRow(droppables, targetRow, currentCenterX)?.droppable || null
    }

    default:
      return null
  }
}

/**
 * Custom coordinate getter that jumps directly to droppable positions
 * instead of moving in pixel increments. This works better with scrolling
 * and provides more predictable navigation.
 */
const droppableJumpKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context, currentCoordinates },
) => {
  const { collisionRect } = context
  const { code } = event

  if (!collisionRect) {
    return currentCoordinates
  }

  // Only handle arrow keys
  if (!['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(code)) {
    return currentCoordinates
  }

  // Prevent default browser scroll behavior for arrow keys
  event.preventDefault()

  // Clear scrollableAncestors to prevent dnd-kit from scrolling instead of moving
  // This must be done on every keydown because context is updated by dnd-kit
  if (context.scrollableAncestors) {
    context.scrollableAncestors.length = 0
  }

  // Get all droppable widgets and their positions
  const droppables = getDroppablePositions()

  if (droppables.length === 0) {
    return currentCoordinates
  }

  // Current position center (viewport coordinates from collisionRect)
  const currentCenterX = collisionRect.left + collisionRect.width / 2
  const currentCenterY = collisionRect.top + collisionRect.height / 2

  // Find the target droppable based on direction
  const targetDroppable = findTargetDroppable(droppables, currentCenterX, currentCenterY, code)

  // If we found a target, scroll if needed and calculate the delta
  if (targetDroppable) {
    const viewportHeight = window.innerHeight
    const targetRect = targetDroppable.rect
    const scrollPadding = 20 // Extra padding to ensure element is fully visible

    // Check if target droppable is fully visible in viewport
    const isAboveViewport = targetRect.top < scrollPadding
    const isBelowViewport = targetRect.bottom > viewportHeight - scrollPadding

    // Scroll to make target visible (using instant scroll for synchronous behavior)
    if (isAboveViewport) {
      const scrollAmount = targetRect.top - scrollPadding
      // don't use smooth scroll here, because it will mess up the delta calculation
      window.scrollBy({ behavior: 'instant', top: scrollAmount })
    } else if (isBelowViewport) {
      const scrollAmount = targetRect.bottom - viewportHeight + scrollPadding
      window.scrollBy({ behavior: 'instant', top: scrollAmount })
    }

    // After scroll, recalculate target position (it may have changed due to scroll)
    const newTargetRect = targetDroppable.element.getBoundingClientRect()
    const newTargetCenterX = newTargetRect.left + newTargetRect.width / 2
    const newTargetCenterY = newTargetRect.top + newTargetRect.height / 2

    // Calculate delta using current overlay position (which didn't change) and new target position
    const deltaX = newTargetCenterX - currentCenterX
    const deltaY = newTargetCenterY - currentCenterY

    // Add delta to currentCoordinates to position overlay's center at target's center
    return {
      x: currentCoordinates.x + deltaX,
      y: currentCoordinates.y + deltaY,
    }
  }

  // No valid target found, stay in place
  return currentCoordinates
}

/**
 * Custom KeyboardSensor that only activates when focus is directly on the
 * draggable element, not on any of its descendants. This allows interactive
 * elements inside draggables (like buttons) to work normally with the keyboard.
 */
class DirectFocusKeyboardSensor extends KeyboardSensor {
  static override activators = [
    {
      eventName: 'onKeyDown' as const,
      handler: (
        event: React.KeyboardEvent,
        {
          keyboardCodes = {
            cancel: [KeyboardCode.Esc],
            end: [KeyboardCode.Space, KeyboardCode.Enter],
            start: [KeyboardCode.Space, KeyboardCode.Enter],
          },
          onActivation,
        }: KeyboardSensorOptions,
        { active }: { active: { node: React.MutableRefObject<HTMLElement | null> } },
      ) => {
        const { code } = event.nativeEvent

        // Only activate if focus is directly on the draggable node, not descendants
        if (event.target !== active.node.current) {
          return false
        }

        if (keyboardCodes.start.includes(code)) {
          event.preventDefault()
          onActivation?.({ event: event.nativeEvent })
          return true
        }

        return false
      },
    },
  ]
}

export function useDashboardSensors() {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(DirectFocusKeyboardSensor, {
      coordinateGetter: droppableJumpKeyboardCoordinateGetter,
    }),
  )
}
