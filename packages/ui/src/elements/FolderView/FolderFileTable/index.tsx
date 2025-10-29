'use client'

import { getTranslation } from '@payloadcms/translations'
import { extractID } from 'payload/shared'
import React from 'react'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatDate } from '../../../utilities/formatDocTitle/formatDateTitle.js'
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'folder-file-table'

type Props = {
  showRelationCell?: boolean
}

export function FolderFileTable({ showRelationCell = true }: Props) {
  const {
    checkIfItemIsDisabled,
    documents,
    focusedRowIndex,
    onItemClick,
    onItemKeyPress,
    selectedItemKeys,
    subfolders,
  } = useFolder()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()

  const [relationToMap] = React.useState(() => {
    const map: Record<string, { plural: string; singular: string }> = {}
    config.collections.forEach((collection) => {
      map[collection.slug] = {
        plural: getTranslation(collection.labels?.plural, i18n),
        singular: getTranslation(collection.labels?.singular, i18n),
      }
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
                  cellValue = formatDate({
                    date: value[name],
                    i18n,
                    pattern: config.admin.dateFormat,
                  })
                }

                if (name === 'type') {
                  cellValue = (
                    <>
                      {relationToMap[relationTo]?.singular || relationTo}
                      {Array.isArray(subfolder.value?.folderType)
                        ? subfolder.value?.folderType.reduce((acc, slug, index) => {
                            if (index === 0) {
                              return ` — ${relationToMap[slug]?.plural || slug}`
                            }
                            if (index > 0) {
                              return `${acc}, ${relationToMap[slug]?.plural || slug}`
                            }
                            return acc
                          }, '')
                        : ''}
                    </>
                  )
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
              disabled={checkIfItemIsDisabled(subfolder)}
              dragData={{
                id: subfolderID,
                type: 'folder',
              }}
              id={subfolderID}
              isDroppable
              isFocused={focusedRowIndex === rowIndex}
              isSelected={selectedItemKeys.has(itemKey)}
              isSelecting={selectedItemKeys.size > 0}
              itemKey={itemKey}
              key={`${rowIndex}-${itemKey}`}
              onClick={(event) => {
                void onItemClick({
                  event,
                  index: rowIndex,
                  item: subfolder,
                })
              }}
              onKeyDown={(event) => {
                void onItemKeyPress({
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
                  cellValue = formatDate({
                    date: value[name],
                    i18n,
                    pattern: config.admin.dateFormat,
                  })
                }

                if (name === 'type') {
                  cellValue = relationToMap[relationTo]?.singular || relationTo
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
              disabled={checkIfItemIsDisabled(document)}
              dragData={{
                id: documentID,
                type: 'document',
              }}
              id={documentID}
              isFocused={focusedRowIndex === rowIndex}
              isSelected={selectedItemKeys.has(itemKey)}
              isSelecting={selectedItemKeys.size > 0}
              itemKey={itemKey}
              key={`${rowIndex}-${itemKey}`}
              onClick={(event) => {
                void onItemClick({
                  event,
                  index: rowIndex,
                  item: document,
                })
              }}
              onKeyDown={(event) => {
                void onItemKeyPress({
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
