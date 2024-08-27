'use client'
import type { JsonObject } from 'payload'

import React from 'react'

import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { RelationshipContent } from '../RelationshipContent/index.js'
import { RowCard } from '../RowCard/index.js'

const baseClass = 'upload upload--has-many'

import './index.scss'

type Props = {
  readonly className?: string
  readonly fileDocs: {
    relationTo: string
    value: JsonObject
  }[]
  readonly isSortable?: boolean
  readonly onRemove?: (value) => void
  readonly onReorder?: (value) => void
}
export function UploadComponentHasMany(props: Props) {
  const { className, fileDocs, isSortable, onRemove, onReorder } = props

  const {
    config: { serverURL },
  } = useConfig()

  const moveRow = React.useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      // if (moveFromIndex === moveToIndex) return

      const updatedArray = [...fileDocs]
      const [item] = updatedArray.splice(moveFromIndex, 1)

      updatedArray.splice(moveToIndex, 0, item)

      onReorder(updatedArray)
    },
    [fileDocs, onReorder],
  )

  const removeItem = React.useCallback(
    (index: number) => {
      const updatedArray = [...(fileDocs || [])]
      updatedArray.splice(index, 1)
      onRemove(updatedArray.length === 0 ? [] : updatedArray)
    },
    [fileDocs, onRemove],
  )

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <DraggableSortable
        className={`${baseClass}__draggable-rows`}
        ids={fileDocs?.map(({ value }) => String(value.id))}
        onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
      >
        {Boolean(fileDocs.length) &&
          fileDocs.map(({ relationTo, value }, index) => {
            const id = String(value.id)
            return (
              <DraggableSortableItem disabled={!isSortable} id={id} key={id}>
                {(draggableSortableItemProps) => (
                  <div
                    className={[
                      `${baseClass}__dragItem`,
                      draggableSortableItemProps && isSortable && `${baseClass}--has-drag-handle`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    ref={draggableSortableItemProps.setNodeRef}
                    style={{
                      transform: draggableSortableItemProps.transform,
                      transition: draggableSortableItemProps.transition,
                      zIndex: draggableSortableItemProps.isDragging ? 1 : undefined,
                    }}
                  >
                    <RowCard size="small">
                      {isSortable && draggableSortableItemProps && (
                        <div
                          className={`${baseClass}__drag`}
                          {...draggableSortableItemProps.attributes}
                          {...draggableSortableItemProps.listeners}
                        >
                          <DragHandleIcon />
                        </div>
                      )}

                      <RelationshipContent
                        alt={(value?.alt || value?.filename) as string}
                        byteSize={value.filesize as number}
                        collectionSlug={relationTo}
                        filename={value.filename as string}
                        id={id}
                        mimeType={value?.mimeType as string}
                        onRemove={() => removeItem(index)}
                        src={`${serverURL}${value.url}`}
                        withMeta={false}
                        x={value?.width as number}
                        y={value?.height as number}
                      />
                    </RowCard>
                  </div>
                )}
              </DraggableSortableItem>
            )
          })}
      </DraggableSortable>
    </div>
  )
}
