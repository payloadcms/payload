import type { CollisionDetection } from '@dnd-kit/core'

/**
 * Collision detection that considers the X
 * axis only with respect to the position of the pointer
 */
export const closestInXAxis: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) {
    return []
  }

  const { x, y } = args.pointerCoordinates
  const collisions: Array<{ data: { value: number }; id: string }> = []

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
