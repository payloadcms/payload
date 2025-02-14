'use client'
import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderInterface } from 'payload/shared'

import { DndContext, DragOverlay, pointerWithin, useDndMonitor } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useModal } from '@faceless-ui/modal'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import type { MoveItemType, PolymorphicRelationshipValue } from '../types.js'

import { GridViewIcon } from '../../../icons/GridView/index.js'
import { ListViewIcon } from '../../../icons/ListView/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DocumentDrawer } from '../../DocumentDrawer/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { FolderBreadcrumbs } from '../Breadcrumbs/index.js'
import { MoveToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import { NewFolderDrawer } from '../Drawers/NewFolder/index.js'
import { RenameFolderDrawer } from '../Drawers/RenameFolder/index.js'
import { FolderFileCard } from '../FolderFileCard/index.js'
import { FolderFileGrid } from '../FolderFileGrid/index.js'
import { FolderFileRow } from '../FolderFileRow/index.js'
import './index.scss'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'
import { strings } from '../strings.js'

const baseClass = 'folder-and-documents'
const renameFolderDrawerSlug = 'rename-folder'
const moveToFolderDrawerSlug = 'move-to-folder'
const newFolderSlug = 'new-folder'

const getShiftSelection = ({
  selectFromIndex,
  selectToIndex,
}: {
  selectFromIndex: number
  selectToIndex: number
}): Set<number> => {
  if (selectFromIndex === null || selectFromIndex === undefined) {
    return new Set([selectToIndex])
  }

  const start = Math.min(selectToIndex, selectFromIndex)
  const end = Math.max(selectToIndex, selectFromIndex)
  const rangeSelection = new Set(
    Array.from({ length: Math.max(start, end) + 1 }, (_, i) => i).filter(
      (index) => index >= start && index <= end,
    ),
  )
  return rangeSelection
}

const getMetaSelection = ({
  selectedIndexes,
  toggleIndex,
}: {
  selectedIndexes: Set<number>
  toggleIndex: number
}): Set<number> => {
  if (selectedIndexes.has(toggleIndex)) {
    selectedIndexes.delete(toggleIndex)
  } else {
    selectedIndexes.add(toggleIndex)
  }
  return selectedIndexes
}

type RowItemEventData = { id: number | string; index: number; relationTo: string }
type OnItemInteractionResult = {
  id: number | string | undefined
  relationTo: string | undefined
}

export const FolderAndDocuments = () => {
  const {
    breadcrumbs,
    collectionUseAsTitles,
    currentFolder,
    deleteCurrentFolder,
    documents,
    folderCollectionSlug,
    folderID,
    isRootFolder,
    moveToFolder,
    populateFolderData,
    removeItems,
    selectedIndexes,
    setBreadcrumbs,
    setFolderID,
    setSelectedIndexes,
    setSubfolders,
    subfolders,
  } = useFolder()
  const { config } = useConfig()
  const { t } = useTranslation()
  const { closeModal, isModalOpen, openModal } = useModal()
  const router = useRouter()

  const [focusedRowIndex, setFocusedRowIndex] = React.useState(undefined)
  const [lastSelected, setLastSelected] = React.useState<number>()
  const [folderToRename, setFolderToRename] = React.useState<FolderInterface>()
  const [itemsToMove, setItemsToMove] = React.useState<MoveItemType[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [viewType, setViewType] = React.useState<'grid' | 'list'>('list')
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const dndContextID = React.useId()
  const lastClickTime = React.useRef(0)
  const renameFolderWasOpenRef = React.useRef(false)

  const subfoldersLength = React.useMemo(() => {
    return subfolders?.length || 0
  }, [subfolders])

  const documentsLength = React.useMemo(() => {
    return documents.length
  }, [documents])

  const totalCount = React.useMemo(() => {
    return subfoldersLength + documentsLength
  }, [subfoldersLength, documentsLength])

  const hiddenMoveToFolderIDs = React.useMemo(
    () =>
      itemsToMove.reduce((acc, item) => {
        if (item.relationTo === folderCollectionSlug) {
          return [...acc, item.value]
        }
        return acc
      }, []),
    [itemsToMove, folderCollectionSlug],
  )

  const onItemKeyPress = React.useCallback(
    ({
      event: e,
      item,
    }: {
      event: React.KeyboardEvent
      item: RowItemEventData
    }): OnItemInteractionResult => {
      const { id, index: itemIndex, relationTo } = item
      const isShiftPressed = e.shiftKey
      const isCtrlPressed = e.ctrlKey || e.metaKey
      let newSelectedIndexes: Set<number> = selectedIndexes

      const navigateTo = {
        id: undefined,
        relationTo: undefined,
      }

      switch (e.code) {
        case 'ArrowDown': {
          e.preventDefault()
          const nextIndex = Math.min(itemIndex + 1, totalCount - 1)
          setFocusedRowIndex(nextIndex)

          if (isCtrlPressed) {
            break
          }

          if (!isShiftPressed) {
            setLastSelected(nextIndex)
            newSelectedIndexes = new Set([nextIndex])
          }
          if (isShiftPressed) {
            newSelectedIndexes = getShiftSelection({
              selectFromIndex: lastSelected,
              selectToIndex: nextIndex,
            })
          }
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prevIndex = Math.max(itemIndex - 1, 0)
          setFocusedRowIndex(prevIndex)

          if (isCtrlPressed) {
            break
          }

          if (!isShiftPressed) {
            setLastSelected(prevIndex)
            newSelectedIndexes = new Set([prevIndex])
          }
          if (isShiftPressed) {
            newSelectedIndexes = getShiftSelection({
              selectFromIndex: lastSelected,
              selectToIndex: prevIndex,
            })
          }
          break
        }
        case 'Enter': {
          if (selectedIndexes.size === 1) {
            newSelectedIndexes = new Set([])
            setFocusedRowIndex(undefined)
            navigateTo.relationTo = relationTo
            navigateTo.id = id
          }
          break
        }
        case 'Escape': {
          setFocusedRowIndex(undefined)
          setSelectedIndexes(new Set([]))
          newSelectedIndexes = new Set([])
          break
        }
        case 'KeyA': {
          if (isCtrlPressed) {
            e.preventDefault()
            setFocusedRowIndex(totalCount - 1)
            newSelectedIndexes = new Set(Array.from({ length: totalCount }, (_, i) => i))
          }
          break
        }
        case 'Space': {
          if (isShiftPressed) {
            e.preventDefault()
            newSelectedIndexes = getMetaSelection({
              selectedIndexes: newSelectedIndexes,
              toggleIndex: itemIndex,
            })
            setLastSelected(itemIndex)
          }
          break
        }
        case 'Tab': {
          if (isShiftPressed) {
            const prevIndex = itemIndex - 1
            if (prevIndex < 0 && newSelectedIndexes.size > 0) {
              setFocusedRowIndex(prevIndex)
            }
          } else {
            const nextIndex = itemIndex + 1
            if (nextIndex === totalCount && newSelectedIndexes.size > 0) {
              setFocusedRowIndex(totalCount - 1)
            }
          }
          break
        }
      }

      setSelectedIndexes(newSelectedIndexes)
      setItemsToMove(
        Array.from(newSelectedIndexes)
          .map((index) => {
            const allItems = [...subfolders, ...documents]
            if (allItems[index]) {
              return allItems[index]
            }
          })
          .filter(Boolean),
      )

      return navigateTo
    },
    [
      documents,
      subfolders,
      lastSelected,
      totalCount,
      setSelectedIndexes,
      setLastSelected,
      selectedIndexes,
    ],
  )

  const onItemClick = React.useCallback(
    ({
      event,
      item,
    }: {
      event: React.MouseEvent
      item: RowItemEventData
    }): OnItemInteractionResult => {
      // Prevent default browser selection behavior
      event.preventDefault()
      const navigateTo = {
        id: undefined,
        relationTo: undefined,
      }

      const { id, index: itemIndex, relationTo } = item
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      let newSelectedIndexes = new Set(selectedIndexes)

      if (isCtrlPressed) {
        newSelectedIndexes = getMetaSelection({
          selectedIndexes: newSelectedIndexes,
          toggleIndex: itemIndex,
        })
      } else if (isShiftPressed && lastSelected !== undefined) {
        newSelectedIndexes = getShiftSelection({
          selectFromIndex: lastSelected,
          selectToIndex: itemIndex,
        })
      } else if (event.type === 'pointermove') {
        // on drag start of an unselected item
        if (!selectedIndexes.has(itemIndex)) {
          newSelectedIndexes = new Set([itemIndex])
        }
      } else {
        // Normal click - select single item
        newSelectedIndexes = new Set([itemIndex])
        const now = Date.now()
        const doubleClicked = now - lastClickTime.current < 400 && lastSelected === itemIndex
        if (doubleClicked) {
          navigateTo.relationTo = relationTo
          navigateTo.id = id
        }
        lastClickTime.current = now
      }

      if (newSelectedIndexes.size === 1) {
        setLastSelected(itemIndex)
      }
      if (newSelectedIndexes.size === 0) {
        setFocusedRowIndex(undefined)
      } else {
        setFocusedRowIndex(itemIndex)
      }
      setSelectedIndexes(newSelectedIndexes)
      setItemsToMove(
        Array.from(newSelectedIndexes)
          .map((index) => {
            const allItems = [...subfolders, ...documents]
            if (allItems[index]) {
              return allItems[index]
            }
          })
          .filter(Boolean),
      )

      return navigateTo
    },
    [
      documents,
      subfolders,
      lastSelected,
      selectedIndexes,
      setSelectedIndexes,
      setFocusedRowIndex,
      setLastSelected,
    ],
  )

  const onItemInteraction = React.useCallback(
    async ({ e, item }: { e: React.KeyboardEvent | React.MouseEvent; item: RowItemEventData }) => {
      let navigateTo = undefined
      if ('key' in e) {
        navigateTo = onItemKeyPress({
          event: e,
          item,
        })
      } else {
        navigateTo = onItemClick({
          event: e,
          item,
        })
      }

      if (navigateTo) {
        if (navigateTo.relationTo === folderCollectionSlug) {
          await setFolderID({ folderID: navigateTo.id })
        } else if (navigateTo.relationTo && navigateTo.id) {
          router.push(
            `${config.routes.admin}/collections/${navigateTo.relationTo}/${navigateTo.id}`,
          )
        }
      }
    },
    [onItemClick, onItemKeyPress, folderCollectionSlug, setFolderID, router, config.routes.admin],
  )

  const onNewFolderCreate = React.useCallback(
    async (doc: FolderInterface) => {
      setSubfolders((prev) => {
        return [
          ...prev,
          {
            relationTo: folderCollectionSlug,
            value: doc,
          },
        ]
      })
      await populateFolderData({ folderID })
      closeModal(newFolderSlug)
    },
    [populateFolderData, closeModal, folderID, folderCollectionSlug, setSubfolders],
  )

  const onRenameSuccess = React.useCallback(
    ({ name, folderID: renamedFolderID }: { folderID: number | string; name: string }) => {
      if (renamedFolderID === folderID) {
        setBreadcrumbs((prev) => {
          return prev.map((breadcrumb) => {
            if (breadcrumb.id === renamedFolderID) {
              return {
                ...breadcrumb,
                name,
              }
            }
            return breadcrumb
          })
        })
      } else {
        setSubfolders((prev) => {
          return prev.map((subfolder) => {
            const subfolderID =
              typeof subfolder.value === 'object' ? subfolder.value?.id : subfolder.value
            if (subfolderID === renamedFolderID) {
              return {
                ...subfolder,
                value: {
                  ...(typeof subfolder.value === 'object'
                    ? subfolder.value
                    : {
                        id: subfolder.value,
                      }),
                  name,
                },
              }
            }
            return subfolder
          })
        })
      }
      closeModal(renameFolderDrawerSlug)
    },
    [closeModal, setSubfolders, folderID, setBreadcrumbs],
  )

  const moveItemsToFolder = React.useCallback(
    async (folderToMoveTo: number | string) => {
      const movingCurrentFolder = itemsToMove.some(({ relationTo, value }) => {
        return relationTo === folderCollectionSlug && value === folderID
      })
      await moveToFolder({
        itemsToMove,
        toFolderID: folderToMoveTo,
      })
      await populateFolderData({ folderID: movingCurrentFolder ? folderToMoveTo : folderID })
    },
    [folderID, folderCollectionSlug, moveToFolder, populateFolderData, itemsToMove],
  )

  const onDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      if (!event.over) {
        return
      }

      await moveItemsToFolder(event.over.id)
    },
    [moveItemsToFolder],
  )

  React.useEffect(() => {
    const renameModalIsOpen = isModalOpen(renameFolderDrawerSlug)
    if (renameFolderWasOpenRef.current && !renameModalIsOpen) {
      setFolderToRename(undefined)
      setSelectedIndexes(new Set([]))
      setItemsToMove([])
    }

    renameFolderWasOpenRef.current = renameModalIsOpen
  }, [isModalOpen, setFolderToRename, setSelectedIndexes, setItemsToMove])

  return (
    <>
      <DndContext collisionDetection={pointerWithin} id={dndContextID}>
        <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
        <div className={baseClass}>
          <div className={`${baseClass}__header`}>
            {breadcrumbs && <FolderBreadcrumbs breadcrumbs={breadcrumbs} />}

            <div className={`${baseClass}__header-actions`}>
              <Popup
                button={
                  <Button
                    buttonStyle="pill"
                    className={`${baseClass}__create-new`}
                    el="div"
                    icon="chevron"
                    size="small"
                  >
                    {t('general:createNew')}
                  </Button>
                }
                buttonType="default"
                className={`${baseClass}__action-popup`}
              >
                <PopupList.ButtonGroup>
                  <PopupList.Button
                    onClick={() => {
                      openModal(newFolderSlug)
                    }}
                  >
                    Folder
                  </PopupList.Button>
                  {config.collections.map((collection, index) => {
                    if (collection.admin.enableFolders) {
                      const label =
                        typeof collection.labels.singular === 'string'
                          ? collection.labels.singular
                          : collection.slug
                      return (
                        <PopupList.Button
                          key={index}
                          onClick={() => {
                            setCreateCollectionSlug(collection.slug)
                            openModal('create-new-document-with-folder')
                          }}
                        >
                          {label}
                        </PopupList.Button>
                      )
                    }
                    return null
                  })}
                </PopupList.ButtonGroup>
              </Popup>
              <Popup
                button={
                  <Button
                    buttonStyle="pill"
                    className={`${baseClass}__create-new`}
                    el="div"
                    icon="threeDots"
                    size="small"
                  />
                }
                className={`${baseClass}__action-popup`}
              >
                <PopupList.ButtonGroup>
                  <PopupList.Button
                    onClick={() => {
                      setFolderToRename(currentFolder)
                      openModal(renameFolderDrawerSlug)
                    }}
                  >
                    Rename Folder
                  </PopupList.Button>
                  <PopupList.Button
                    disabled={isRootFolder}
                    onClick={() => {
                      setItemsToMove([
                        {
                          relationTo: folderCollectionSlug,
                          value: currentFolder.id,
                        },
                      ])
                      openModal(moveToFolderDrawerSlug)
                    }}
                  >
                    Move Folder
                  </PopupList.Button>
                  <PopupList.Button
                    disabled={isRootFolder}
                    onClick={async () => {
                      await deleteCurrentFolder()
                    }}
                  >
                    Delete Folder
                  </PopupList.Button>
                </PopupList.ButtonGroup>
              </Popup>
            </div>

            <div className={`${baseClass}__search`}>
              <p>Search...</p>
              <div className={`${baseClass}__search-actions`}>
                {selectedIndexes.size > 0 && (
                  <>
                    <Button
                      buttonStyle="pill"
                      onClick={async () => {
                        await removeItems(Array.from(selectedIndexes))
                      }}
                      size="small"
                    >
                      Delete ({selectedIndexes.size})
                    </Button>
                    <Button
                      buttonStyle="pill"
                      onClick={() => {
                        openModal(moveToFolderDrawerSlug)
                      }}
                      size="small"
                    >
                      Move ({selectedIndexes.size})
                    </Button>
                  </>
                )}
                <Button
                  buttonStyle="pill"
                  className={`${baseClass}__grid-toggle ${viewType === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewType('grid')}
                  size="small"
                >
                  <GridViewIcon />
                </Button>
                <Button
                  buttonStyle="pill"
                  className={`${baseClass}__list-toggle ${viewType === 'list' ? 'active' : ''}`}
                  onClick={() => setViewType('list')}
                  size="small"
                >
                  <ListViewIcon />
                </Button>
              </div>
            </div>
          </div>

          {viewType === 'grid' ? (
            <>
              <FolderFileGrid className={`${baseClass}__subfolders`}>
                {!subfolders || subfolders?.length === 0
                  ? null
                  : subfolders.map((subfolder, subfolderIndex) => {
                      const { relationTo, value } = subfolder
                      const useAsTitle = collectionUseAsTitles.has(relationTo)
                        ? collectionUseAsTitles.get(relationTo)
                        : 'id'
                      const subfolderID = typeof value === 'object' ? value?.id : value
                      const title =
                        typeof value === 'object' ? value?.[useAsTitle] || subfolderID : subfolderID
                      return (
                        <FolderFileCard
                          id={subfolderID}
                          isDragging={isDragging}
                          isDroppable
                          isFocused={focusedRowIndex === subfolderIndex}
                          isSelected={selectedIndexes.has(subfolderIndex)}
                          isSelecting={selectedIndexes.size > 0}
                          key={subfolderID}
                          onClick={(e) => {
                            void onItemInteraction({
                              e,
                              item: { id: subfolderID, index: subfolderIndex, relationTo },
                            })
                          }}
                          PopupActions={
                            <PopupList.ButtonGroup>
                              <PopupList.Button
                                id="action-rename-folder"
                                onClick={() => {
                                  setFolderToRename(value as FolderInterface)
                                  openModal(renameFolderDrawerSlug)
                                }}
                              >
                                {strings.rename}
                              </PopupList.Button>
                              <PopupList.Button
                                id="action-move-folder"
                                onClick={() => {
                                  setItemsToMove([subfolder])
                                  openModal(moveToFolderDrawerSlug)
                                }}
                              >
                                {strings.move}
                              </PopupList.Button>
                              {folderID ? (
                                <PopupList.Button
                                  id="action-delete-folder"
                                  onClick={() => removeItems([subfolderIndex])}
                                >
                                  {t('general:delete')}
                                </PopupList.Button>
                              ) : null}
                            </PopupList.ButtonGroup>
                          }
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
                        const documentID = typeof value === 'object' ? value?.id : value
                        const useAsTitle = collectionUseAsTitles.has(relationTo)
                          ? collectionUseAsTitles.get(relationTo)
                          : 'id'
                        const title =
                          typeof value === 'object' ? value[useAsTitle] || documentID : documentID
                        const adjustedIndex = documentIndex + subfoldersLength
                        return (
                          <FolderFileCard
                            id={documentID}
                            isDragging={isDragging}
                            isFocused={focusedRowIndex === adjustedIndex}
                            isSelected={selectedIndexes.has(adjustedIndex)}
                            isSelecting={selectedIndexes.size > 0}
                            key={documentID}
                            onClick={(e) => {
                              void onItemInteraction({
                                e,
                                item: { id: documentID, index: adjustedIndex, relationTo },
                              })
                            }}
                            PopupActions={
                              <PopupList.ButtonGroup>
                                <PopupList.Button
                                  id="action-move-file"
                                  onClick={() => {
                                    setItemsToMove([document])
                                    openModal(moveToFolderDrawerSlug)
                                  }}
                                >
                                  {strings.move}
                                </PopupList.Button>
                                <PopupList.Button
                                  disabled={isRootFolder}
                                  id="action-delete-file"
                                  onClick={() => removeItems([adjustedIndex])}
                                >
                                  {strings.removeFromFolder}
                                </PopupList.Button>
                              </PopupList.ButtonGroup>
                            }
                            title={title}
                            type="file"
                          />
                        )
                      })}
                </FolderFileGrid>
              </div>
            </>
          ) : (
            <SimpleTable
              headerCells={[
                <TableHeader key={'name'}>Title</TableHeader>,
                <TableHeader key={'createdAt'}>Created At</TableHeader>,
                <TableHeader key={'updatedAt'}>Updated At</TableHeader>,
              ]}
              tableRows={[
                ...subfolders.map((subfolder, subfolderIndex) => {
                  const { relationTo, value } = subfolder
                  const subfolderID = typeof value === 'object' ? value?.id : value
                  const useAsTitle = collectionUseAsTitles.has(relationTo)
                    ? collectionUseAsTitles.get(relationTo)
                    : 'id'
                  const title =
                    typeof value === 'object' ? value?.[useAsTitle] || subfolderID : subfolderID
                  return (
                    <FolderFileRow
                      columns={[title, value?.createdAt, value?.updatedAt]}
                      id={subfolderID}
                      isDragging={isDragging}
                      isDroppable
                      isFocused={focusedRowIndex === subfolderIndex}
                      isSelected={selectedIndexes.has(subfolderIndex)}
                      isSelecting={selectedIndexes.size > 0}
                      key={subfolderID}
                      onEvent={(e) => {
                        void onItemInteraction({
                          e,
                          item: { id: subfolderID, index: subfolderIndex, relationTo },
                        })
                      }}
                      type="folder"
                    />
                  )
                }),

                ...documents.map((document, documentIndex) => {
                  const { relationTo, value } = document
                  const documentID = typeof value === 'object' ? value?.id : value
                  const useAsTitle = collectionUseAsTitles.has(relationTo)
                    ? collectionUseAsTitles.get(relationTo)
                    : 'id'
                  const title = (
                    typeof value === 'object' ? value?.[useAsTitle] || documentID : documentID
                  ) as string
                  const adjustedIndex = documentIndex + subfoldersLength
                  return (
                    <FolderFileRow
                      columns={[title, value.createdAt, value.updatedAt]}
                      id={documentID}
                      isDragging={isDragging}
                      isFocused={focusedRowIndex === adjustedIndex}
                      isSelected={selectedIndexes.has(adjustedIndex)}
                      isSelecting={selectedIndexes.size > 0}
                      key={documentID}
                      onEvent={(e) => {
                        void onItemInteraction({
                          e,
                          item: { id: documentID, index: adjustedIndex, relationTo },
                        })
                      }}
                      type="file"
                    />
                  )
                }),
              ]}
            />
          )}
        </div>
        <DragOverlay
          dropAnimation={null}
          modifiers={[snapCenterToCursor]}
          style={{
            height: 'unset',
            maxWidth: '220px',
          }}
        >
          <DragCards
            allItems={[...subfolders, ...documents]}
            collectionUseAsTitles={collectionUseAsTitles}
            lastSelected={lastSelected}
            selectedCount={selectedIndexes.size}
          />
        </DragOverlay>
      </DndContext>

      <RenameFolderDrawer
        drawerSlug={renameFolderDrawerSlug}
        folderToRename={folderToRename}
        onRenameConfirm={onRenameSuccess}
      />

      <MoveToFolderDrawer
        drawerSlug={moveToFolderDrawerSlug}
        hiddenFolderIDs={hiddenMoveToFolderIDs}
        onMoveConfirm={async (folderIDToMove) => {
          await moveItemsToFolder(folderIDToMove)
          closeModal(moveToFolderDrawerSlug)
        }}
      />

      <DocumentDrawer
        collectionSlug={createCollectionSlug}
        drawerSlug="create-new-document-with-folder"
        initialData={{
          _parentFolder: folderID,
        }}
        onSave={({ operation }) => {
          if (operation === 'create') {
            closeModal('create-new-document-with-folder')
            setCreateCollectionSlug(undefined)
            void populateFolderData({ folderID })
          }
        }}
        redirectAfterCreate={false}
      />

      <NewFolderDrawer drawerSlug={newFolderSlug} onNewFolderSuccess={onNewFolderCreate} />
    </>
  )
}

function DndEventListener({ onDragEnd, setIsDragging }) {
  // Monitor drag and drop events that happen on the parent `DndContext` provider
  useDndMonitor({
    onDragCancel() {
      setIsDragging(false)
    },
    onDragEnd(event) {
      setIsDragging(false)
      onDragEnd(event)
    },
    onDragStart() {
      setIsDragging(true)
    },
  })

  return null
}

type DragCardsProps = {
  readonly allItems: Array<PolymorphicRelationshipValue>
  readonly collectionUseAsTitles: Map<string, string>
  readonly lastSelected?: number
  readonly selectedCount: number
}
function DragCards({
  allItems,
  collectionUseAsTitles,
  lastSelected,
  selectedCount,
}: DragCardsProps) {
  const { relationTo, value } = allItems[lastSelected || 0]
  if (!selectedCount) {
    return null
  }
  const useAsTitle = collectionUseAsTitles.has(relationTo)
    ? collectionUseAsTitles.get(relationTo)
    : 'id'
  const title = typeof value === 'object' ? value?.[useAsTitle] : value
  return (
    <div className={`${baseClass}__drag-cards`}>
      {Array.from({ length: selectedCount > 1 ? 2 : 1 }).map((_, index) => (
        <div
          className={`${baseClass}__drag-card`}
          key={index}
          style={{
            right: `${index * 3}px`,
            top: `-${index * 3}px`,
          }}
        >
          <FolderFileCard id="" isSelected title={title} type="folder" />
        </div>
      ))}
      {selectedCount > 1 ? (
        <span className={`${baseClass}__drag-card-count`}>{selectedCount}</span>
      ) : null}
    </div>
  )
}
