import type { CollisionDetection } from '@dnd-kit/core'

import { rectIntersection } from '@dnd-kit/core'

// If the toolbar exits the preview area, we need to reset its position
// This will prevent the toolbar from getting stuck outside the preview area
export const customCollisionDetection: CollisionDetection = ({
  collisionRect,
  droppableContainers,
  ...args
}) => {
  const droppableContainer = droppableContainers.find(({ id }) => id === 'live-preview-area')

  const rectIntersectionCollisions = rectIntersection({
    ...args,
    collisionRect,
    droppableContainers: [droppableContainer],
  })

  // Collision detection algorithms return an array of collisions
  if (rectIntersectionCollisions.length === 0) {
    // The preview area is not intersecting, return early
    return rectIntersectionCollisions
  }

  // Compute whether the draggable element is completely contained within the preview area
  const previewAreaRect = droppableContainer?.rect?.current

  const isContained =
    collisionRect.top >= previewAreaRect.top &&
    collisionRect.left >= previewAreaRect.left &&
    collisionRect.bottom <= previewAreaRect.bottom &&
    collisionRect.right <= previewAreaRect.right

  if (isContained) {
    return rectIntersectionCollisions
  }
}
