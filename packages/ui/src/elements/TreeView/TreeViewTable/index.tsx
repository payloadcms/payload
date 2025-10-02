'use client'

import { extractID } from 'payload/shared'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useTreeView } from '../../../providers/TreeView/index.js'
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { DraggableTableRow } from '../../folderView/DraggableTableRow/index.js'
import { SimpleTable, TableHeader } from '../../folderView/SimpleTable/index.js'
import { GridTable } from '../GridTable/index.js'
import { NestedItemsTable } from '../NestedItemsTable/index.js'
import './index.scss'

const baseClass = 'tree-view-results-table'

export function TreeViewTable() {
  const {
    checkIfItemIsDisabled,
    documents,
    dragStartX,
    focusedRowIndex,
    isDragging,
    onItemClick,
    onItemKeyPress,
    selectedItemKeys,
  } = useTreeView()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()

  const [columns] = React.useState(() => [
    {
      name: 'name',
      label: t('general:name'),
    },
    {
      name: 'updatedAt',
      label: t('general:updatedAt'),
    },
  ])

  return (
    <NestedItemsTable
      className={baseClass}
      dragStartX={dragStartX}
      isDragging={isDragging}
      // columns={columns}
    />
  )

  // return (
  //   <SimpleTable
  //     headerCells={columns.map(({ name, label }) => (
  //       <TableHeader key={name}>{label}</TableHeader>
  //     ))}
  //     tableRows={[
  //       ...documents.map((document, unadjustedIndex) => {
  //         const { itemKey, value } = document
  //         const documentID = extractID(value)
  //         const rowIndex = unadjustedIndex

  //         return (
  //           <DraggableTableRow
  //             columns={columns.map(({ name }, index) => {
  //               let cellValue: React.ReactNode = '—'
  //               if (name === 'name' && value._folderOrDocumentTitle !== undefined) {
  //                 cellValue = value._folderOrDocumentTitle
  //               }

  //               if (name === 'updatedAt' && value[name]) {
  //                 cellValue = formatDate({
  //                   date: value[name],
  //                   i18n,
  //                   pattern: config.admin.dateFormat,
  //                 })
  //               }
  //               return cellValue
  //             })}
  //             disabled={checkIfItemIsDisabled(document)}
  //             dragData={{
  //               id: documentID,
  //               type: 'document',
  //             }}
  //             id={documentID}
  //             isFocused={focusedRowIndex === rowIndex}
  //             isSelected={selectedItemKeys.has(itemKey)}
  //             isSelecting={selectedItemKeys.size > 0}
  //             itemKey={itemKey}
  //             key={`${rowIndex}-${itemKey}`}
  //             onClick={(event) => {
  //               void onItemClick({
  //                 event,
  //                 index: rowIndex,
  //                 item: document,
  //               })
  //             }}
  //             onKeyDown={(event) => {
  //               void onItemKeyPress({
  //                 event,
  //                 index: rowIndex,
  //                 item: document,
  //               })
  //             }}
  //           />
  //         )
  //       }),
  //     ]}
  //   />
  // )
}
