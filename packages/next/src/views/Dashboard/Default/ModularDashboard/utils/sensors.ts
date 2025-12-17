import type { KeyboardCoordinateGetter, KeyboardSensorOptions } from '@dnd-kit/core'

import { KeyboardCode, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

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
  // Find current droppable index (closest to current position)
  let currentIndex = -1
  let minDistanceToCurrent = Infinity

  droppables.forEach((droppable, index) => {
    const dx = droppable.centerX - currentCenterX
    const dy = droppable.centerY - currentCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistanceToCurrent) {
      minDistanceToCurrent = distance
      currentIndex = index
    }
  })

  if (currentIndex === -1) {
    return null
  }

  const currentDroppable = droppables[currentIndex]
  const currentRow = currentDroppable.row

  switch (direction) {
    case 'ArrowDown': {
      // Find droppables in row + 1 and get the one with closest X
      const targetRow = currentRow + 1
      const candidatesInRow = droppables.filter((d) => d.row === targetRow)

      if (candidatesInRow.length === 0) {
        return null
      }

      let closest: DroppablePosition | null = null
      let minXDistance = Infinity

      for (const droppable of candidatesInRow) {
        const xDistance = Math.abs(droppable.centerX - currentCenterX)
        if (xDistance < minXDistance) {
          minXDistance = xDistance
          closest = droppable
        }
      }
      return closest
    }

    case 'ArrowLeft':
      // Previous in DOM order
      return droppables[currentIndex - 1] || null

    case 'ArrowRight':
      // Next in DOM order
      return droppables[currentIndex + 1] || null

    case 'ArrowUp': {
      // Find droppables in row - 1 and get the one with closest X
      const targetRow = currentRow - 1
      const candidatesInRow = droppables.filter((d) => d.row === targetRow)

      if (candidatesInRow.length === 0) {
        return null
      }

      let closest: DroppablePosition | null = null
      let minXDistance = Infinity

      for (const droppable of candidatesInRow) {
        const xDistance = Math.abs(droppable.centerX - currentCenterX)
        if (xDistance < minXDistance) {
          minXDistance = xDistance
          closest = droppable
        }
      }
      return closest
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

  // Get all droppable widgets and their positions
  const droppables = getDroppablePositions()

  if (droppables.length === 0) {
    return currentCoordinates
  }

  // Current position center
  const currentCenterX = collisionRect.left + collisionRect.width / 2
  const currentCenterY = collisionRect.top + collisionRect.height / 2

  // Find the target droppable based on direction
  const targetDroppable = findTargetDroppable(droppables, currentCenterX, currentCenterY, code)

  // If we found a target, move to it
  if (targetDroppable) {
    // Scroll the target into view if needed
    requestAnimationFrame(() => {
      targetDroppable.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    return {
      x: targetDroppable.centerX,
      y: targetDroppable.centerY,
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(DirectFocusKeyboardSensor, {
      coordinateGetter: droppableJumpKeyboardCoordinateGetter,
    }),
  )
}
