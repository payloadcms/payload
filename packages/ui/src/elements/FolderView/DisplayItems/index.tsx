'use client'

import { useRouter } from 'next/navigation.js'
import { extractID, type GetFolderDataResult } from 'payload/shared'
import React from 'react'

import type { FolderContextValue } from '../../../providers/Folders/index.js'
import type { PolymorphicRelationshipValue } from '../types.js'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import { FolderFileCard } from '../FolderFileCard/index.js'
import { FolderFileGrid } from '../FolderFileGrid/index.js'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'display-items'

type ItemKey = `${string}-${number | string}`
type Props = {
  readonly disabledItems?: PolymorphicRelationshipValue[]
  readonly isMovingItems?: boolean
  readonly RenderDocumentActionGroup?: (args: {
    document: GetFolderDataResult['documents'][number]
    index: number
  }) => React.ReactNode
  readonly RenderSubfolderActionGroup?: (args: {
    index: number
    subfolder: GetFolderDataResult['subfolders'][number]
  }) => React.ReactNode
  readonly selectedItems: PolymorphicRelationshipValue[]
  readonly viewType: 'grid' | 'list'
} & Pick<
  FolderContextValue,
  'collectionUseAsTitles' | 'documents' | 'folderCollectionSlug' | 'setFolderID' | 'subfolders'
>

export function DisplayItems(props: Props) {
  const {
    collectionUseAsTitles,
    disabledItems = [],
    documents = [],
    folderCollectionSlug,
    isMovingItems = false,
    RenderDocumentActionGroup,
    RenderSubfolderActionGroup,
    selectedItems = [],
    setFolderID,
    subfolders = [],
    viewType,
  } = props

  const router = useRouter()
  const { config } = useConfig()
  const { focusedRowIndex, onItemClick, onItemKeyPress, selectedIndexes } = useFolder()

  const totalCount = subfolders.length + documents.length || 0

  const selectedItemKeys = new Set<`${string}-${number | string}`>(
    selectedItems.reduce((acc, item) => {
      if (item) {
        if (item.relationTo && item.value) {
          acc.push(`${item.relationTo}-${extractID(item.value)}`)
        }
      }
      return acc
    }, []),
  )

  const disabledItemKeys = new Set<`${string}-${number | string}`>(
    disabledItems.reduce((acc, item) => {
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

  return (
    <>
      {viewType === 'grid' ? (
        <div className={baseClass}>
          <FolderFileGrid className={`${baseClass}__subfolders`}>
            {!subfolders || subfolders?.length === 0
              ? null
              : subfolders.map((subfolder, subfolderIndex) => {
                  const { relationTo, value } = subfolder
                  const useAsTitle = collectionUseAsTitles.has(relationTo)
                    ? collectionUseAsTitles.get(relationTo)
                    : 'id'
                  const subfolderID = extractID(value)
                  const title =
                    typeof value === 'object' ? value?.[useAsTitle] || subfolderID : subfolderID
                  const itemKey: ItemKey = `${relationTo}-${subfolderID}`
                  return (
                    <FolderFileCard
                      disabled={
                        (isMovingItems && selectedItemKeys.has(itemKey)) ||
                        disabledItemKeys?.has(itemKey)
                      }
                      id={subfolderID}
                      isFocused={focusedRowIndex === subfolderIndex}
                      isSelected={selectedItemKeys.has(itemKey)}
                      itemKey={itemKey}
                      key={itemKey}
                      onClick={(event) => {
                        void handleItemClick({
                          event,
                          item: { id: subfolderID, index: subfolderIndex, relationTo },
                        })
                      }}
                      onKeyDown={(event) => {
                        void handleItemKeyPress({
                          event,
                          item: { id: subfolderID, index: subfolderIndex, relationTo },
                        })
                      }}
                      PopupActions={
                        RenderSubfolderActionGroup
                          ? RenderSubfolderActionGroup({
                              index: subfolderIndex,
                              subfolder,
                            })
                          : null
                      }
                      selectedCount={selectedIndexes.size}
                      title={title}
                      type="folder"
                    />
                  )
                })}
          </FolderFileGrid>

          <div>
            <FolderFileGrid className={`${baseClass}__documents`}>
              {!documents || documents?.length === 0
                ? null
                : documents.map((document, documentIndex) => {
                    const { relationTo, value } = document
                    const documentID = extractID(value)
                    const useAsTitle = collectionUseAsTitles.has(relationTo)
                      ? collectionUseAsTitles.get(relationTo)
                      : 'id'
                    const title =
                      typeof value === 'object' ? value[useAsTitle] || documentID : documentID
                    const previewUrl =
                      typeof value === 'object' &&
                      'mimeType' in value &&
                      'url' in value &&
                      typeof value.url === 'string'
                        ? value.url
                        : undefined
                    const adjustedIndex = documentIndex + subfolders.length
                    const itemKey: ItemKey = `${relationTo}-${documentID}`
                    return (
                      <FolderFileCard
                        disabled={isMovingItems || disabledItemKeys?.has(itemKey)}
                        id={documentID}
                        isFocused={focusedRowIndex === adjustedIndex}
                        isSelected={selectedItemKeys.has(itemKey)}
                        itemKey={itemKey}
                        key={itemKey}
                        onClick={(event) => {
                          void handleItemClick({
                            event,
                            item: { id: documentID, index: adjustedIndex, relationTo },
                          })
                        }}
                        onKeyDown={(event) => {
                          void handleItemKeyPress({
                            event,
                            item: { id: documentID, index: adjustedIndex, relationTo },
                          })
                        }}
                        PopupActions={
                          RenderDocumentActionGroup
                            ? RenderDocumentActionGroup({
                                document,
                                index: adjustedIndex,
                              })
                            : null
                        }
                        previewUrl={previewUrl}
                        selectedCount={selectedIndexes.size}
                        title={title}
                        type="file"
                      />
                    )
                  })}
            </FolderFileGrid>
          </div>
        </div>
      ) : (
        totalCount > 0 && (
          <SimpleTable
            headerCells={[
              <TableHeader key={'name'}>Title</TableHeader>,
              <TableHeader key={'createdAt'}>Created At</TableHeader>,
              <TableHeader key={'updatedAt'}>Updated At</TableHeader>,
            ]}
            tableRows={[
              ...subfolders.map((subfolder, subfolderIndex) => {
                const { relationTo, value } = subfolder
                const subfolderID = extractID(value)
                const useAsTitle = collectionUseAsTitles.has(relationTo)
                  ? collectionUseAsTitles.get(relationTo)
                  : 'id'
                const title =
                  typeof value === 'object' ? value?.[useAsTitle] || subfolderID : subfolderID
                const itemKey: ItemKey = `${relationTo}-${subfolderID}`
                return (
                  <DraggableTableRow
                    columns={[
                      <span className={`${baseClass}__cell-with-icon`} key={subfolderID}>
                        <FolderIcon />
                        {title}
                      </span>,
                      // @ts-expect-error
                      value?.createdAt,
                      // @ts-expect-error
                      value?.updatedAt,
                    ]}
                    disabled={
                      (isMovingItems && selectedItemKeys.has(itemKey)) ||
                      disabledItemKeys?.has(itemKey)
                    }
                    dragData={{
                      id: subfolderID,
                      type: 'folder',
                    }}
                    id={subfolderID}
                    isDroppable
                    isFocused={focusedRowIndex === subfolderIndex}
                    isSelected={selectedItemKeys.has(itemKey)}
                    isSelecting={selectedIndexes.size > 0}
                    itemKey={itemKey}
                    key={itemKey}
                    onClick={(event) => {
                      void handleItemClick({
                        event,
                        item: { id: subfolderID, index: subfolderIndex, relationTo },
                      })
                    }}
                    onKeyDown={(event) => {
                      void handleItemKeyPress({
                        event,
                        item: { id: subfolderID, index: subfolderIndex, relationTo },
                      })
                    }}
                  />
                )
              }),

              ...documents.map((document, documentIndex) => {
                const { relationTo, value } = document
                const documentID = extractID(value)
                const useAsTitle = collectionUseAsTitles.has(relationTo)
                  ? collectionUseAsTitles.get(relationTo)
                  : 'id'
                const title = (
                  typeof value === 'object' ? value?.[useAsTitle] || documentID : documentID
                ) as string
                const adjustedIndex = documentIndex + subfolders.length
                const itemKey: ItemKey = `${relationTo}-${documentID}`
                return (
                  <DraggableTableRow
                    columns={[
                      <span className={`${baseClass}__cell-with-icon`} key={documentID}>
                        <DocumentIcon />
                        {title}
                      </span>,
                      title,
                      // @ts-expect-error
                      value.createdAt,
                      // @ts-expect-error
                      value.updatedAt,
                    ]}
                    disabled={isMovingItems || disabledItemKeys?.has(itemKey)}
                    dragData={{
                      id: documentID,
                      type: 'folder',
                    }}
                    id={documentID}
                    isFocused={focusedRowIndex === adjustedIndex}
                    isSelected={selectedItemKeys.has(itemKey)}
                    isSelecting={selectedIndexes.size > 0}
                    itemKey={itemKey}
                    key={itemKey}
                    onClick={(event) => {
                      void handleItemClick({
                        event,
                        item: { id: documentID, index: adjustedIndex, relationTo },
                      })
                    }}
                    onKeyDown={(event) => {
                      void handleItemKeyPress({
                        event,
                        item: { id: documentID, index: adjustedIndex, relationTo },
                      })
                    }}
                  />
                )
              }),
            ]}
          />
        )
      )}
    </>
  )
}
