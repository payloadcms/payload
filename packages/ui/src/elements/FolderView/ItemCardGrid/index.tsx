'use client'

import type { FolderDocumentItemKey, FolderOrDocument } from 'payload/shared'

import React from 'react'

import { useFolder } from '../../../providers/Folders/index.js'
import { FolderFileCard } from '../FolderFileCard/index.js'
import './index.scss'

const baseClass = 'item-card-grid'

type ItemCardGridProps = {
  disabledItemKeys?: Set<FolderDocumentItemKey>
  items: FolderOrDocument[]
  RenderActionGroup?: (args: { index: number; item: FolderOrDocument }) => React.ReactNode
  selectedItemKeys: Set<FolderDocumentItemKey>
  title?: string
} & (
  | {
      subfolderCount: number
      type: 'file'
    }
  | {
      subfolderCount?: never
      type: 'folder'
    }
)
export function ItemCardGrid({
  type,
  disabledItemKeys,
  items,
  RenderActionGroup,
  selectedItemKeys,
  subfolderCount,
  title,
}: ItemCardGridProps) {
  const { focusedRowIndex, isDragging, onItemClick, onItemKeyPress, selectedIndexes } = useFolder()

  return (
    <>
      {title && <p className={`${baseClass}__title`}>{title}</p>}
      <div className={baseClass}>
        {!items || items?.length === 0
          ? null
          : items.map((item, _index) => {
              const index = _index + (subfolderCount || 0)
              const { itemKey, value } = item

              return (
                <FolderFileCard
                  disabled={
                    (isDragging && selectedItemKeys.has(itemKey)) || disabledItemKeys?.has(itemKey)
                  }
                  id={value.id}
                  isFocused={focusedRowIndex === index}
                  isSelected={selectedItemKeys.has(itemKey)}
                  itemKey={itemKey}
                  key={itemKey}
                  onClick={(event) => {
                    void onItemClick({ event, index, item })
                  }}
                  onKeyDown={(event) => {
                    void onItemKeyPress({ event, index, item })
                  }}
                  PopupActions={
                    RenderActionGroup
                      ? RenderActionGroup({
                          index,
                          item,
                        })
                      : null
                  }
                  previewUrl={value?.url}
                  selectedCount={selectedIndexes.size}
                  title={value._folderOrDocumentTitle}
                  type={type}
                />
              )
            })}
      </div>
    </>
  )
}
