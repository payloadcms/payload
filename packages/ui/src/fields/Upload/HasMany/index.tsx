'use client'
import type { JsonObject } from 'payload'

import React from 'react'

import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../../elements/DraggableSortable/index.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import { RelationshipContent } from '../RelationshipContent/index.js'
import { UploadCard } from '../UploadCard/index.js'

const baseClass = 'upload upload--has-many'

import { isImage } from 'payload/shared'

import './index.scss'

import type { ReloadDoc } from '../types.js'

import { getBestFitFromSizes } from '../../../utilities/getBestFitFromSizes.js'

type Props = {
  readonly className?: string
  readonly displayPreview?: boolean
  readonly fileDocs: {
    relationTo: string
    value: JsonObject
  }[]
  readonly isSortable?: boolean
  readonly onRemove?: (value) => void
  readonly onReorder?: (value) => void
  readonly readonly?: boolean
  readonly reloadDoc: ReloadDoc
  readonly serverURL: string
}

export function UploadComponentHasMany(props: Props) {
  const {
    className,
    displayPreview,
    fileDocs,
    isSortable,
    onRemove,
    onReorder,
    readonly,
    reloadDoc,
    serverURL,
  } = props

  const moveRow = React.useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      if (moveFromIndex === moveToIndex) {
        return
      }

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
        {fileDocs.map(({ relationTo, value }, index) => {
          const id = String(value.id)
          let src: string
          let thumbnailSrc: string

          if (value.url) {
            try {
              src = new URL(value.url, serverURL).toString()
            } catch {
              src = `${serverURL}${value.url}`
            }
          }

          if (value.thumbnailURL) {
            try {
              thumbnailSrc = new URL(value.thumbnailURL, serverURL).toString()
            } catch {
              thumbnailSrc = `${serverURL}${value.thumbnailURL}`
            }
          }

          if (isImage(value.mimeType)) {
            thumbnailSrc = getBestFitFromSizes({
              sizes: value.sizes,
              thumbnailURL: thumbnailSrc,
              url: src,
              width: value.width,
            })
          }

          return (
            <DraggableSortableItem disabled={!isSortable || readonly} id={id} key={id}>
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
                  <UploadCard size="small">
                    {draggableSortableItemProps && (
                      <div
                        className={`${baseClass}__drag`}
                        {...draggableSortableItemProps.attributes}
                        {...draggableSortableItemProps.listeners}
                      >
                        <DragHandleIcon />
                      </div>
                    )}

                    <RelationshipContent
                      allowEdit={!readonly}
                      allowRemove={!readonly}
                      alt={(value?.alt || value?.filename) as string}
                      byteSize={value.filesize as number}
                      collectionSlug={relationTo}
                      displayPreview={displayPreview}
                      filename={value.filename as string}
                      id={id}
                      mimeType={value?.mimeType as string}
                      onRemove={() => removeItem(index)}
                      reloadDoc={reloadDoc}
                      src={src}
                      thumbnailSrc={thumbnailSrc}
                      withMeta={false}
                      x={value?.width as number}
                      y={value?.height as number}
                    />
                  </UploadCard>
                </div>
              )}
            </DraggableSortableItem>
          )
        })}
      </DraggableSortable>
    </div>
  )
}
