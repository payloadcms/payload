import type { CollisionDetection } from '@dnd-kit/core'

/** Prefer nearby row boundaries for pointers, and exact target centers for keyboard dragging. */
export const closestInXAxis: CollisionDetection = (args) => {
  const collisions: Array<{ data: { value: number }; id: string }> = []
  const rowCollisions: Array<{ data: { value: number }; id: string }> = []
  const coordinates =
    args.pointerCoordinates ??
    (args.collisionRect
      ? {
          x: args.collisionRect.left + args.collisionRect.width / 2,
          y: args.collisionRect.top + args.collisionRect.height / 2,
        }
      : null)

  if (!coordinates) {
    return []
  }

  const { x, y } = coordinates
  const initialRect = args.active?.rect.current.initial

  if (
    !args.pointerCoordinates &&
    initialRect &&
    Math.abs(x - initialRect.left - initialRect.width / 2) < 0.5 &&
    Math.abs(y - initialRect.top - initialRect.height / 2) < 0.5
  ) {
    return []
  }

  for (const container of args.droppableContainers) {
    const rect = args.droppableRects.get(container.id)

    if (!rect || rect.width <= 0 || rect.height <= 0) {
      continue
    }

    if (!args.pointerCoordinates) {
      collisions.push({
        id: String(container.id),
        data: { value: Math.hypot(x - rect.left - rect.width / 2, y - rect.top - rect.height / 2) },
      })
      continue
    }

    const position = container.data.current?.position
    const isRowTarget = position === 'row-after' || position === 'row-before'

    if (isRowTarget) {
      if (
        args.pointerCoordinates &&
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        rowCollisions.push({
          id: String(container.id),
          data: { value: Math.abs(y - (rect.top + rect.height / 2)) },
        })
      }
    } else if (y >= rect.top && y <= rect.bottom) {
      collisions.push({
        id: String(container.id),
        data: { value: Math.abs(x - (rect.left + rect.width / 2)) },
      })
    }
  }

  return (rowCollisions.length ? rowCollisions : collisions).sort(
    (a, b) => a.data.value - b.data.value,
  )
}
