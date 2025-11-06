import type { CollisionDetection } from '@dnd-kit/core'

import { pointerWithin, rectIntersection } from '@dnd-kit/core'

import type { WidgetInstanceClient } from '../client.js'

/**
 * Check if a point is in the left half of a rectangle
 */
function isPointInLeftHalf(
  point: { x: number; y: number },
  rect: { left: number; right: number },
): boolean {
  const midpoint = rect.left + (rect.right - rect.left) / 2
  return point.x < midpoint
}

/**
 * Custom collision detection that checks if pointer is in left or right half
 * of a widget. If in right half, returns collision with next widget instead.
 */
function createPointerWithinWithHalfDetection(
  currentLayout: undefined | WidgetInstanceClient[],
): CollisionDetection {
  return (args) => {
    if (!currentLayout) {
      return pointerWithin(args)
    }

    const pointerCollisions = pointerWithin(args)

    if (pointerCollisions.length === 0) {
      return []
    }

    const { droppableContainers, droppableRects, pointerCoordinates } = args

    if (!pointerCoordinates) {
      return []
    }

    const modifiedCollisions = []

    for (const collision of pointerCollisions) {
      const { id } = collision
      const rect = droppableRects.get(id)

      if (!rect) {
        modifiedCollisions.push(collision)
        continue
      }

      // Check if pointer is in left or right half
      if (isPointInLeftHalf(pointerCoordinates, rect)) {
        // Left half: return collision with current widget
        modifiedCollisions.push(collision)
      } else {
        // Right half: find next widget and return collision with it
        const currentIndex = currentLayout.findIndex((w) => w.item.i === id)
        const nextIndex = currentIndex + 1

        if (nextIndex < currentLayout.length) {
          const nextWidgetId = currentLayout[nextIndex].item.i
          const nextContainer = droppableContainers.find((c) => c.id === nextWidgetId)

          if (nextContainer) {
            const nextRect = droppableRects.get(nextWidgetId)
            if (nextRect) {
              // Calculate distance to next widget's corners for sorting
              const corners = [
                { x: nextRect.left, y: nextRect.top },
                { x: nextRect.right, y: nextRect.top },
                { x: nextRect.left, y: nextRect.bottom },
                { x: nextRect.right, y: nextRect.bottom },
              ]
              const distances = corners.reduce(
                (accumulator, corner) =>
                  accumulator +
                  Math.sqrt(
                    Math.pow(pointerCoordinates.x - corner.x, 2) +
                      Math.pow(pointerCoordinates.y - corner.y, 2),
                  ),
                0,
              )
              const effectiveDistance = Number((distances / 4).toFixed(4))

              modifiedCollisions.push({
                id: nextWidgetId,
                data: { droppableContainer: nextContainer, value: effectiveDistance },
              })
            }
          }
        } else {
          // No next widget, return collision with current widget
          modifiedCollisions.push(collision)
        }
      }
    }

    // Sort collisions by distance value (ascending)
    return modifiedCollisions.sort((a, b) => {
      const aValue = a.data?.value ?? Infinity
      const bValue = b.data?.value ?? Infinity
      return aValue - bValue
    })
  }
}

/**
 * Custom collision detection that checks if pointer is in left or right half
 * of a widget. If in right half, returns collision with next widget instead.
 * Falls back to rectIntersection for a11y reasons.
 */
export function customCollision(
  currentLayout: undefined | WidgetInstanceClient[],
): CollisionDetection {
  const pointerCollisionDetection = createPointerWithinWithHalfDetection(currentLayout)

  return (args) => {
    // First, use our custom pointer collision detection
    const pointerCollisions = pointerCollisionDetection(args)

    // Collision detection algorithms return an array of collisions
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // If there are no collisions with the pointer, return rectangle intersections
    return rectIntersection(args)
  }
}
