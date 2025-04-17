import type { I18nClient } from '@payloadcms/translations'
import type { FolderDocumentItemKey, FolderOrDocument } from 'payload/shared'

import { extractID } from 'payload/shared'

import type { FormatDateArgs } from '../../../utilities/formatDocTitle/formatDateTitle.js'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'folder-file-table'
const columns = [
  {
    name: 'title',
    label: 'Title',
  },
  {
    name: 'createdAt',
    label: 'Created At',
  },
  {
    name: 'updatedAt',
    label: 'Updated At',
  },
]

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
  subfolders,
}: Props) {
  return (
    <SimpleTable
      headerCells={columns.map(({ name, label }) => (
        <TableHeader key={name}>{label}</TableHeader>
      ))}
      tableRows={[
        ...subfolders.map((subfolder, rowIndex) => {
          const { itemKey, value } = subfolder
          const subfolderID = extractID(value)

          return (
            <DraggableTableRow
              columns={columns.map(({ name }, index) => {
                let cellValue = '—'
                if (name === 'title' && value._folderOrDocumentTitle !== undefined) {
                  cellValue = value._folderOrDocumentTitle
                }

                if ((name === 'createdAt' || name === 'updatedAt') && value[name]) {
                  cellValue = formatDate({ date: value[name], i18n, pattern: dateFormat })
                }

                if (index === 0) {
                  return (
                    <span className={`${baseClass}__cell-with-icon`} key={`${itemKey}-${name}`}>
                      <FolderIcon />
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
              // @todo: might need to revert this to look at selectedIndexes.
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
          const { itemKey, value } = document
          const documentID = extractID(value)
          const rowIndex = unadjustedIndex + subfolders.length

          return (
            <DraggableTableRow
              columns={columns.map(({ name }, index) => {
                let cellValue = '—'
                if (name === 'title' && value._folderOrDocumentTitle !== undefined) {
                  cellValue = value._folderOrDocumentTitle
                }

                if ((name === 'createdAt' || name === 'updatedAt') && value[name]) {
                  cellValue = formatDate({ date: value[name], i18n, pattern: dateFormat })
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
