import type { CollisionDetection } from '@dnd-kit/core'

/**
 * Collision detection that considers the X
 * axis only with respect to the position of the pointer (or collisionRect for keyboard)
 */
export const closestInXAxis: CollisionDetection = (args) => {
  const collisions: Array<{ data: { value: number }; id: string }> = []

  // Use pointer coordinates if available (mouse/touch), otherwise use collisionRect center (keyboard)
  let x: number
  let y: number

  if (args.pointerCoordinates) {
    x = args.pointerCoordinates.x
    y = args.pointerCoordinates.y
  } else if (args.collisionRect) {
    // For keyboard navigation, use the center of the collisionRect
    x = args.collisionRect.left + args.collisionRect.width / 2
    y = args.collisionRect.top + args.collisionRect.height / 2
  } else {
    return []
  }

  for (const container of args.droppableContainers) {
    const rect = args.droppableRects.get(container.id)
    if (!rect) {
      continue
    }

    // Only consider widgets in the same row (same Y axis)
    if (y >= rect.top && y <= rect.bottom) {
      const centerX = rect.left + rect.width / 2
      const distance = Math.abs(x - centerX)
      collisions.push({ id: String(container.id), data: { value: distance } })
    }
  }

  return collisions.sort((a, b) => a.data.value - b.data.value)
}
