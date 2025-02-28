'use client'
import React from 'react'

import { Button } from '../../Button/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import './index.scss'

const baseClass = 'file-details-draggable'

import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload'

import { DraggableSortableItem } from '../../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DragHandleIcon } from '../../../icons/DragHandle/index.js'
import { EditIcon } from '../../../icons/Edit/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'

export type DraggableFileDetailsProps = {
  collectionSlug: string
  customUploadActions?: React.ReactNode[]
  doc: {
    sizes?: FileSizes
  } & Data
  enableAdjustments?: boolean
  hasImageSizes?: boolean
  hasMany: boolean
  hideRemoveFile?: boolean
  imageCacheTag?: string
  isSortable?: boolean
  removeItem?: (index: number) => void
  rowIndex: number
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const DraggableFileDetails: React.FC<DraggableFileDetailsProps> = (props) => {
  const {
    collectionSlug,
    doc,
    hideRemoveFile,
    imageCacheTag,
    isSortable,
    removeItem,
    rowIndex,
    uploadConfig,
  } = props

  const { id, filename, thumbnailURL, url } = doc

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id,
    collectionSlug,
  })

  return (
    <DraggableSortableItem id={id} key={id}>
      {(draggableSortableItemProps) => (
        <div
          className={[
            baseClass,
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
          <div className={`${baseClass}--drag-wrapper`}>
            {isSortable && draggableSortableItemProps && (
              <div
                className={`${baseClass}__drag`}
                {...draggableSortableItemProps.attributes}
                {...draggableSortableItemProps.listeners}
              >
                <DragHandleIcon />
              </div>
            )}
            <Thumbnail
              className={`${baseClass}__thumbnail`}
              collectionSlug={collectionSlug}
              doc={doc}
              fileSrc={thumbnailURL || url}
              imageCacheTag={imageCacheTag}
              uploadConfig={uploadConfig}
            />
          </div>
          <div className={`${baseClass}__main-detail`}>{filename}</div>

          <div className={`${baseClass}__actions`}>
            <DocumentDrawer />
            <DocumentDrawerToggler>
              <EditIcon />
            </DocumentDrawerToggler>
            {!hideRemoveFile && removeItem && (
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="none"
                onClick={() => removeItem(rowIndex)}
                round
              />
            )}
          </div>
        </div>
      )}
    </DraggableSortableItem>
  )
}
