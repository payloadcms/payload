'use client'
import type { DragEndEvent } from '@dnd-kit/core'

import { DndContext, DragOverlay, pointerWithin, useDndMonitor } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useModal } from '@faceless-ui/modal'
import { extractID, type FolderInterface } from 'payload/shared'
import React from 'react'

import type { PolymorphicRelationshipValue } from '../types.js'

import { GridViewIcon } from '../../../icons/GridView/index.js'
import { ListViewIcon } from '../../../icons/ListView/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { usePreferences } from '../../../providers/Preferences/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DocumentDrawer } from '../../DocumentDrawer/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { FolderBreadcrumbs } from '../Breadcrumbs/index.js'
import { DisplayItems } from '../DisplayItems/index.js'
import { MoveToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import { NewFolderDrawer } from '../Drawers/NewFolder/index.js'
import { RenameFolderDrawer } from '../Drawers/RenameFolder/index.js'
import { FolderFileCard } from '../FolderFileCard/index.js'
import './index.scss'
import { strings } from '../strings.js'

const baseClass = 'folder-and-documents'
const renameFolderDrawerSlug = 'rename-folder'
const moveToFolderDrawerSlug = 'move-to-folder'
const newFolderSlug = 'new-folder'

type Props = {
  initialDisplayType: 'grid' | 'list'
}

export const FolderAndDocuments = ({ initialDisplayType }: Props) => {
  const {
    breadcrumbs,
    collectionUseAsTitles,
    currentFolder,
    deleteCurrentFolder,
    documents,
    folderCollectionSlug,
    folderID,
    isRootFolder,
    itemsToMove,
    lastSelectedIndex,
    moveToFolder,
    populateFolderData,
    removeItems,
    selectedIndexes,
    setBreadcrumbs,
    setFolderID,
    setItemsToMove,
    setLastSelectedIndex,
    setSelectedIndexes,
    setSubfolders,
    subfolders,
  } = useFolder()
  const { config } = useConfig()
  const { t } = useTranslation()
  const { closeModal, isModalOpen, openModal } = useModal()

  const [folderToRename, setFolderToRename] = React.useState<FolderInterface>()
  const [isDragging, setIsDragging] = React.useState(false)
  const { setPreference } = usePreferences()
  const [viewType, setViewType] = React.useState<'grid' | 'list'>(initialDisplayType || 'grid')
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const dndContextID = React.useId()
  const renameFolderWasOpenRef = React.useRef(false)

  const hiddenMoveToFolderIDs = React.useMemo(
    () =>
      itemsToMove.reduce((acc, item) => {
        if (item.relationTo === folderCollectionSlug) {
          return [...acc, extractID(item.value)]
        }
        return acc
      }, []),
    [itemsToMove, folderCollectionSlug],
  )

  const onDisplayTypeChange = React.useCallback(
    (newDisplayType: 'grid' | 'list') => {
      setViewType(newDisplayType)
      void setPreference('folder-view-display', newDisplayType)
    },
    [setPreference],
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
                  disabled={viewType === 'grid'}
                  onClick={() => onDisplayTypeChange('grid')}
                  size="small"
                >
                  <GridViewIcon />
                </Button>
                <Button
                  buttonStyle="pill"
                  className={`${baseClass}__list-toggle ${viewType === 'list' ? 'active' : ''}`}
                  disabled={viewType === 'list'}
                  onClick={() => onDisplayTypeChange('list')}
                  size="small"
                >
                  <ListViewIcon />
                </Button>
              </div>
            </div>
          </div>

          <DisplayItems
            collectionUseAsTitles={collectionUseAsTitles}
            documents={documents}
            folderCollectionSlug={folderCollectionSlug}
            isDragging={isDragging}
            lastSelectedIndex={lastSelectedIndex}
            RenderDocumentActionGroup={({ document, index }) => (
              <PopupList.ButtonGroup>
                <PopupList.Button
                  id="action-move-document"
                  onClick={() => {
                    setItemsToMove([document])
                    openModal(moveToFolderDrawerSlug)
                  }}
                >
                  {strings.move}
                </PopupList.Button>
                <PopupList.Button
                  disabled={isRootFolder}
                  id="action-delete-document"
                  onClick={() => removeItems([index])}
                >
                  {strings.removeFromFolder}
                </PopupList.Button>
              </PopupList.ButtonGroup>
            )}
            RenderSubfolderActionGroup={({ index, subfolder }) => (
              <PopupList.ButtonGroup>
                <PopupList.Button
                  id="action-rename-folder"
                  onClick={() => {
                    setFolderToRename(subfolder.value as FolderInterface)
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
                  <PopupList.Button id="action-delete-folder" onClick={() => removeItems([index])}>
                    {t('general:delete')}
                  </PopupList.Button>
                ) : null}
              </PopupList.ButtonGroup>
            )}
            selectedIndexes={selectedIndexes}
            setFolderID={setFolderID}
            setItemsToMove={setItemsToMove}
            setLastSelectedIndex={setLastSelectedIndex}
            setSelectedIndexes={setSelectedIndexes}
            subfolders={subfolders}
            viewType={viewType}
          />
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
            lastSelected={lastSelectedIndex}
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
