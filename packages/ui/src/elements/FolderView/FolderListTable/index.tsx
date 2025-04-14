'use client'

import type { Column } from 'payload'

import { useRouter } from 'next/navigation.js'
import { extractID } from 'payload/shared'
import React from 'react'

import { useClickOutside } from '../../../hooks/useClickOutside.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import './index.scss'

const baseClass = 'table'

export type Props = {
  readonly appearance?: 'condensed' | 'default'
  readonly columns?: Column[]
}

type ItemKey = `${string}-${number | string}`

export const FolderListTable: React.FC<Props> = ({ appearance, columns }) => {
  const activeColumns = columns?.filter((col) => col?.active)
  const tableRef = React.useRef<HTMLTableSectionElement>(null)
  useClickOutside(
    tableRef,
    () => {
      if (tableRef.current) {
        setFocusedRowIndex(-1)
      }
    },
    true,
  )

  const router = useRouter()
  const { config } = useConfig()
  const {
    documents,
    focusedRowIndex,
    folderCollectionSlug,
    getSelectedItems,
    isDragging,
    onItemClick,
    onItemKeyPress,
    selectedIndexes,
    setFocusedRowIndex,
    setFolderID,
    subfolders,
  } = useFolder()

  const totalCount = subfolders.length + documents.length || 0

  const selectedItemKeys = new Set<`${string}-${number | string}`>(
    getSelectedItems().reduce((acc, item) => {
      if (item) {
        if (item.relationTo && item.value) {
          acc.push(`${item.relationTo}-${extractID(item.value)}`)
        }
      }
      return acc
    }, []),
  )

  const navigateAfterClick = React.useCallback(
    ({ collectionSlug, docID }: { collectionSlug: string; docID: number | string }) => {
      if (collectionSlug === folderCollectionSlug) {
        setFolderID({ folderID: docID })
      } else if (collectionSlug) {
        router.push(`${config.routes.admin}/collections/${collectionSlug}/${docID}`)
      }
    },
    [setFolderID, folderCollectionSlug, router, config.routes.admin],
  )

  const handleItemKeyPress = React.useCallback(
    ({
      event,
      item,
    }: {
      event: React.KeyboardEvent
      item: { id: number | string; index: number; relationTo: string }
    }): void => {
      const { keyCode } = onItemKeyPress({ event, index: item.index })

      if (selectedIndexes.size === 1 && keyCode === 'Enter') {
        navigateAfterClick({ collectionSlug: item.relationTo, docID: item.id })
      }
    },
    [onItemKeyPress, selectedIndexes, navigateAfterClick],
  )

  const handleItemClick = React.useCallback(
    ({
      event,
      item,
    }: {
      event: React.MouseEvent
      item: { id: number | string; index: number; relationTo: string }
    }): void => {
      const { doubleClicked } = onItemClick({ event, index: item.index })

      if (doubleClicked) {
        navigateAfterClick({ collectionSlug: item.relationTo, docID: item.id })
      }
    },
    [onItemClick, navigateAfterClick],
  )

  if (!activeColumns || activeColumns.length === 0) {
    return <div>No columns selected</div>
  }

  return (
    <div
      className={[baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <table cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {activeColumns.map((col, i) => (
              <th id={`heading-${col.accessor}`} key={i}>
                {col.Heading}
              </th>
            ))}
          </tr>
        </thead>
        {totalCount > 0 && (
          <tbody ref={tableRef}>
            {Array.isArray(subfolders) && subfolders.length
              ? subfolders.map((subfolder, rowIndex) => {
                  const { relationTo, value } = subfolder
                  const subfolderID = extractID(value)
                  const itemKey: ItemKey = `${relationTo}-${subfolderID}`

                  return (
                    <DraggableTableRow
                      columns={activeColumns.map(
                        (columnCell) => columnCell.renderedCells[rowIndex],
                      )}
                      disabled={isDragging && selectedItemKeys.has(itemKey)}
                      dragData={{
                        id: subfolderID,
                        type: 'folder',
                      }}
                      id={subfolderID}
                      isDroppable
                      isFocused={focusedRowIndex === rowIndex}
                      isSelected={selectedItemKeys.has(itemKey)}
                      isSelecting={selectedIndexes.size > 0}
                      itemKey={itemKey}
                      key={`${rowIndex}-${itemKey}`}
                      onClick={(event) => {
                        void handleItemClick({
                          event,
                          item: {
                            id: subfolderID,
                            index: rowIndex,
                            relationTo,
                          },
                        })
                      }}
                      onKeyDown={(event) => {
                        void handleItemKeyPress({
                          event,
                          item: {
                            id: subfolderID,
                            index: rowIndex,
                            relationTo,
                          },
                        })
                      }}
                    />
                  )
                })
              : null}

            {documents &&
              documents.map((documentData, unadjustedRowIndex) => {
                const { relationTo, value } = documentData
                const documentID = extractID(value)
                const itemKey: ItemKey = `${relationTo}-${documentID}`
                const rowIndex = unadjustedRowIndex + subfolders.length
                return (
                  <DraggableTableRow
                    columns={activeColumns.map((columnCell) => columnCell.renderedCells[rowIndex])}
                    disabled={isDragging}
                    dragData={{
                      id: documentID,
                      type: 'document',
                    }}
                    id={documentID}
                    isDroppable={false}
                    isFocused={focusedRowIndex === rowIndex}
                    isSelected={selectedItemKeys.has(itemKey)}
                    isSelecting={selectedIndexes.size > 0}
                    itemKey={itemKey}
                    key={rowIndex}
                    onClick={(event) => {
                      void handleItemClick({
                        event,
                        item: {
                          id: documentID,
                          index: rowIndex,
                          relationTo,
                        },
                      })
                    }}
                    onKeyDown={(event) => {
                      void handleItemKeyPress({
                        event,
                        item: {
                          id: documentID,
                          index: rowIndex,
                          relationTo,
                        },
                      })
                    }}
                  />
                )
              })}
          </tbody>
        )}
      </table>
    </div>
  )
}
