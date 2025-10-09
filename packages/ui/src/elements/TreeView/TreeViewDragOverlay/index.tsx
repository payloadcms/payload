import type { Modifier } from '@dnd-kit/core'
import type { TreeViewItem } from 'payload/shared'

import { DragOverlay } from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'

import { Pill } from '../../Pill/index.js'
import './index.scss'

const baseClass = 'tree-view-drag-overlay'

type TreeViewDragOverlayProps = {
  readonly item: TreeViewItem
  readonly selectedCount: number
}

export function TreeViewDragOverlay({ item, selectedCount }: TreeViewDragOverlayProps) {
  return (
    <DragOverlay
      dropAnimation={null}
      modifiers={[snapTopLeftToCursor]}
      style={{
        height: 'unset',
        width: '300px',
      }}
    >
      <div className={`${baseClass}__container`}>
        <div className={`${baseClass}__row`}>
          <div className={`${baseClass}__content`}>
            <Pill pillStyle="light-gray" size="small">
              {item.value.title || item.value.id}
            </Pill>
          </div>
          {selectedCount > 1 && <span className={`${baseClass}__count`}>{selectedCount}</span>}
        </div>
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
      y: transform.y + offsetY + 35,
    }
  }

  return transform
}
