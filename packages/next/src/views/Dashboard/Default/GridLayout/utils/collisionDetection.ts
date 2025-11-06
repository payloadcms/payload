import type { CollisionDetection } from '@dnd-kit/core'

import { pointerWithin, rectIntersection } from '@dnd-kit/core'

import type { DropTargetWidget, WidgetInstanceClient } from '../client.js'

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
 * of a widget. Falls back to rectIntersection for a11y reasons.
 */
export function customCollision(
  currentLayout: undefined | WidgetInstanceClient[],
  setDropTargetWidget: (widget: DropTargetWidget) => void,
): CollisionDetection {
  let lastTargetKey: null | string = null

  return (args) => {
    const { droppableRects, pointerCoordinates } = args

    // Try pointer collision detection first
    if (pointerCoordinates) {
      const pointerCollisions = pointerWithin(args)

      if (pointerCollisions.length > 0 && currentLayout) {
        const firstCollision = pointerCollisions[0]
        const widgetId = firstCollision.id as string
        const rect = droppableRects.get(widgetId)

        if (rect) {
          // Determine if pointer is in first half (before) or second half (after)
          const position = isPointInLeftHalf(pointerCoordinates, rect) ? 'before' : 'after'
          const targetKey = `${widgetId}-${position}`

          // Only update if target changed
          if (targetKey !== lastTargetKey) {
            lastTargetKey = targetKey
            const targetWidget = currentLayout.find((w) => w.item.i === widgetId)
            if (targetWidget) {
              setDropTargetWidget({ position, widget: targetWidget })
            }
          }

          return pointerCollisions
        }
      }
    }

    // Fallback to rectangle intersection
    const rectCollisions = rectIntersection(args)
    if (rectCollisions.length > 0 && currentLayout) {
      const firstCollision = rectCollisions[0]
      const widgetId = firstCollision.id as string
      const targetKey = `${widgetId}-after`

      if (targetKey !== lastTargetKey) {
        lastTargetKey = targetKey
        const targetWidget = currentLayout.find((w) => w.item.i === widgetId)
        if (targetWidget) {
          setDropTargetWidget({ position: 'after', widget: targetWidget })
        }
      }
    } else {
      // Reset when there are no collisions
      if (lastTargetKey !== null) {
        lastTargetKey = null
        setDropTargetWidget(null)
      }
    }

    return rectCollisions
  }
}
