import type { KeyboardCoordinateGetter } from '@dnd-kit/core'

import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

import type { KeyboardDropTarget } from './getKeyboardDropTarget.js'

import { getKeyboardDropTarget } from './getKeyboardDropTarget.js'

type DroppablePosition = {
  element: HTMLElement
  rect: DOMRect
} & KeyboardDropTarget

function getDroppablePositions(): DroppablePosition[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.droppable-widget:not([hidden]), .dashboard-row-drop-target',
    ),
  ).flatMap((element) => {
    const rect = element.getBoundingClientRect()
    const index = Number(element.dataset.dropIndex)

    if (!rect.width || !rect.height || !Number.isInteger(index)) {
      return []
    }

    return [
      {
        id: element.dataset.testid ?? '',
        element,
        index,
        rect,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    ]
  })
}

/** Jump to valid widget edges or row boundaries, keeping the chosen target visible. */
export const droppableJumpKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { active, context, currentCoordinates },
) => {
  const { collisionRect } = context
  const { code } = event

  if (!collisionRect || !['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(code)) {
    return currentCoordinates
  }

  event.preventDefault()
  context.scrollableAncestors.length = 0
  const droppables = getDroppablePositions()
  const currentCenterX = collisionRect.left + collisionRect.width / 2
  const currentCenterY = collisionRect.top + collisionRect.height / 2
  const activeNode = document.getElementById(String(active))
  const activeIndex = Number(activeNode?.closest<HTMLElement>('.widget')?.dataset.widgetIndex ?? 0)
  const currentIndex =
    droppables.find(({ id }) => id === String(context.over?.id))?.index ?? activeIndex
  const target = getKeyboardDropTarget({
    currentIndex,
    direction: code,
    isRTL: activeNode ? getComputedStyle(activeNode).direction === 'rtl' : false,
    targets: droppables,
    x: currentCenterX,
    y: currentCenterY,
  })

  if (!target) {
    return currentCoordinates
  }

  const scrollPadding = 20

  if (target.rect.top < scrollPadding) {
    window.scrollBy({ behavior: 'instant', top: target.rect.top - scrollPadding })
  } else if (target.rect.bottom > window.innerHeight - scrollPadding) {
    window.scrollBy({
      behavior: 'instant',
      top: target.rect.bottom - window.innerHeight + scrollPadding,
    })
  }

  const rect = target.element.getBoundingClientRect()

  return {
    x: currentCoordinates.x + rect.left + rect.width / 2 - currentCenterX,
    y: currentCoordinates.y + rect.top + rect.height / 2 - currentCenterY,
  }
}

export function useDashboardSensors() {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: droppableJumpKeyboardCoordinateGetter,
    }),
  )
}
