import type { I18nClient } from '@payloadcms/translations'
import type { FolderDocumentItemKey, FolderOrDocument } from 'payload/shared'

import { getTranslation } from '@payloadcms/translations'
import { extractID } from 'payload/shared'
import React from 'react'

import type { FormatDateArgs } from '../../../utilities/formatDocTitle/formatDateTitle.js'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'folder-file-table'

type Props = {
  dateFormat: FormatDateArgs['pattern']
  disabledItems?: Set<FolderDocumentItemKey>
  documents: FolderOrDocument[]
  focusedRowIndex: number
  i18n: I18nClient
  isMovingItems: boolean
  onRowClick: (args: {
    event: React.MouseEvent<Element>
    index: number
    item: FolderOrDocument
  }) => void
  onRowPress: (args: {
    event: React.KeyboardEvent<Element>
    index: number
    item: FolderOrDocument
  }) => void
  selectedItems: Set<FolderDocumentItemKey>
  showRelationCell?: boolean
  subfolders: FolderOrDocument[]
}

export function FolderFileTable({
  dateFormat,
  disabledItems = new Set(),
  documents,
  focusedRowIndex,
  i18n,
  isMovingItems,
  onRowClick,
  onRowPress,
  selectedItems,
  showRelationCell = true,
  subfolders,
}: Props) {
  const { config } = useConfig()
  const { t } = useTranslation()

  const [relationToMap] = React.useState(() => {
    const map: Record<string, string> = {}
    config.collections.forEach((collection) => {
      map[collection.slug] = getTranslation(collection.labels?.singular, i18n)
    })
    return map
  })

  const [columns] = React.useState(() => {
    const columnsToShow = [
      {
        name: 'name',
        label: t('general:name'),
      },
      {
        name: 'createdAt',
        label: t('general:createdAt'),
      },
      {
        name: 'updatedAt',
        label: t('general:updatedAt'),
      },
    ]

    if (showRelationCell) {
      columnsToShow.push({
        name: 'type',
        label: t('version:type'),
      })
    }

    return columnsToShow
  })

  return (
    <SimpleTable
      headerCells={columns.map(({ name, label }) => (
        <TableHeader key={name}>{label}</TableHeader>
      ))}
      tableRows={[
        ...subfolders.map((subfolder, rowIndex) => {
          const { itemKey, relationTo, value } = subfolder
          const subfolderID = extractID(value)

          return (
            <DraggableTableRow
              columns={columns.map(({ name }, index) => {
                let cellValue: React.ReactNode = '—'
                if (name === 'name' && value._folderOrDocumentTitle !== undefined) {
                  cellValue = value._folderOrDocumentTitle
                }

                if ((name === 'createdAt' || name === 'updatedAt') && value[name]) {
                  cellValue = formatDate({ date: value[name], i18n, pattern: dateFormat })
                }

                if (name === 'type') {
                  cellValue = relationToMap[relationTo] || relationTo
                }

                if (index === 0) {
                  return (
                    <span className={`${baseClass}__cell-with-icon`} key={`${itemKey}-${name}`}>
                      <ColoredFolderIcon />
                      {cellValue}
                    </span>
                  )
                } else {
                  return cellValue
                }
              })}
              disabled={
                (isMovingItems && selectedItems?.has(itemKey)) || disabledItems?.has(itemKey)
              }
              dragData={{
                id: subfolderID,
                type: 'folder',
              }}
              id={subfolderID}
              isDroppable
              isFocused={focusedRowIndex === rowIndex}
              isSelected={selectedItems.has(itemKey)}
              isSelecting={selectedItems.size > 0}
              itemKey={itemKey}
              key={`${rowIndex}-${itemKey}`}
              onClick={(event) => {
                void onRowClick({
                  event,
                  index: rowIndex,
                  item: subfolder,
                })
              }}
              onKeyDown={(event) => {
                void onRowPress({
                  event,
                  index: rowIndex,
                  item: subfolder,
                })
              }}
            />
          )
        }),

        ...documents.map((document, unadjustedIndex) => {
          const { itemKey, relationTo, value } = document
          const documentID = extractID(value)
          const rowIndex = unadjustedIndex + subfolders.length

          return (
            <DraggableTableRow
              columns={columns.map(({ name }, index) => {
                let cellValue: React.ReactNode = '—'
                if (name === 'name' && value._folderOrDocumentTitle !== undefined) {
                  cellValue = value._folderOrDocumentTitle
                }

                if ((name === 'createdAt' || name === 'updatedAt') && value[name]) {
                  cellValue = formatDate({ date: value[name], i18n, pattern: dateFormat })
                }

                if (name === 'type') {
                  cellValue = relationToMap[relationTo] || relationTo
                }

                if (index === 0) {
                  return (
                    <span className={`${baseClass}__cell-with-icon`} key={`${itemKey}-${name}`}>
                      <DocumentIcon />
                      {cellValue}
                    </span>
                  )
                } else {
                  return cellValue
                }
              })}
              disabled={isMovingItems || disabledItems?.has(itemKey)}
              dragData={{
                id: documentID,
                type: 'document',
              }}
              id={documentID}
              isFocused={focusedRowIndex === rowIndex}
              isSelected={selectedItems.has(itemKey)}
              isSelecting={selectedItems.size > 0}
              itemKey={itemKey}
              key={`${rowIndex}-${itemKey}`}
              onClick={(event) => {
                void onRowClick({
                  event,
                  index: rowIndex,
                  item: document,
                })
              }}
              onKeyDown={(event) => {
                void onRowPress({
                  event,
                  index: rowIndex,
                  item: document,
                })
              }}
            />
          )
        }),
      ]}
    />
  )
}
