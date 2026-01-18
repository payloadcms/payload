import type { Modifier } from '@dnd-kit/core'
import type { FolderOrDocument } from '@ruya.sa/payload/shared'

import { DragOverlay } from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'

import { FolderFileCard } from '../FolderFileCard/index.js'
import './index.scss'

const baseClass = 'drag-overlay-selection'

type DragCardsProps = {
  readonly item: FolderOrDocument
  readonly selectedCount: number
}
export function DragOverlaySelection({ item, selectedCount }: DragCardsProps) {
  return (
    <DragOverlay
      dropAnimation={null}
      modifiers={[snapTopLeftToCursor]}
      style={{
        height: 'unset',
        maxWidth: '220px',
      }}
    >
      <div className={`${baseClass}__cards`}>
        {Array.from({ length: selectedCount > 1 ? 2 : 1 }).map((_, index) => (
          <div
            className={`${baseClass}__card`}
            key={index}
            style={{
              right: `${index * 3}px`,
              top: `-${index * 3}px`,
            }}
          >
            <FolderFileCard
              id={null}
              isSelected
              itemKey="overlay-card"
              title={item.value._folderOrDocumentTitle}
              type="folder"
            />
          </div>
        ))}
        {selectedCount > 1 ? (
          <span className={`${baseClass}__card-count`}>{selectedCount}</span>
        ) : null}
      </div>
    </DragOverlay>
  )
}

export const snapTopLeftToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const activatorCoordinates = getEventCoordinates(activatorEvent)

    if (!activatorCoordinates) {
      return transform
    }

    const offsetX = activatorCoordinates.x - draggingNodeRect.left
    const offsetY = activatorCoordinates.y - draggingNodeRect.top

    return {
      ...transform,
      x: transform.x + offsetX + 5,
      y: transform.y + offsetY + 5,
    }
  }

  return transform
}
