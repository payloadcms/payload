'use client'
import type { DragEndEvent } from '@dnd-kit/core'

import { DndContext, pointerWithin, useDndMonitor } from '@dnd-kit/core'
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
import { DragOverlaySelection } from '../DragOverlaySelection/index.js'
import { MoveToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import { NewFolderDrawer } from '../Drawers/NewFolder/index.js'
import { RenameFolderDrawer } from '../Drawers/RenameFolder/index.js'
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
    getSelectedItems,
    isRootFolder,
    lastSelectedIndex,
    moveToFolder,
    populateFolderData,
    removeItems,
    selectedIndexes,
    setBreadcrumbs,
    setFolderID,
    setLastSelectedIndex,
    setSelectedIndexes,
    setSubfolders,
    subfolders,
  } = useFolder()
  const { config } = useConfig()
  const { t } = useTranslation()
  const { setPreference } = usePreferences()
  const { closeModal, isModalOpen, openModal } = useModal()

  const [folderToRename, setFolderToRename] = React.useState<FolderInterface>()
  const [isDragging, setIsDragging] = React.useState(false)
  const [viewType, setViewType] = React.useState<'grid' | 'list'>(initialDisplayType || 'grid')
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const [hiddenFolderIDs, setHiddenFolderIDs] = React.useState<(number | string)[]>([])
  const [itemsToMove, setItemsToMove] = React.useState<PolymorphicRelationshipValue[]>([])
  const dndContextID = React.useId()
  const renameFolderWasOpenRef = React.useRef(false)

  const onDisplayTypeChange = React.useCallback(
    (newDisplayType: 'grid' | 'list') => {
      setViewType(newDisplayType)
      void setPreference('folder-view-display', newDisplayType)
    },
    [setPreference],
  )

  // When the move to folder drawer is opened
  // - set hidden folders from the items that are being moved
  // - set the items that are being moved
  const onMoveToFolderOpen = React.useCallback(
    ({ items }: { items: PolymorphicRelationshipValue[] }) => {
      setHiddenFolderIDs(
        items.reduce<(number | string)[]>((acc, { relationTo, value }) => {
          if (relationTo === folderCollectionSlug) {
            acc.push(extractID(value))
          }

          return acc
        }, []),
      )
      setItemsToMove(items)
      openModal(moveToFolderDrawerSlug)
    },
    [openModal, folderCollectionSlug],
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

  const onDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      if (!event.over) {
        return
      }

      await moveToFolder({
        itemsToMove: getSelectedItems(),
        toFolderID: event.over.id,
      })
    },
    [moveToFolder, getSelectedItems],
  )

  React.useEffect(() => {
    const renameModalIsOpen = isModalOpen(renameFolderDrawerSlug)
    if (renameFolderWasOpenRef.current && !renameModalIsOpen) {
      setFolderToRename(undefined)
      setSelectedIndexes(new Set([]))
    }

    renameFolderWasOpenRef.current = renameModalIsOpen
  }, [isModalOpen, setFolderToRename, setSelectedIndexes])

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
                      onMoveToFolderOpen({
                        items: [
                          {
                            relationTo: folderCollectionSlug,
                            value: currentFolder,
                          },
                        ],
                      })
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
                        onMoveToFolderOpen({ items: getSelectedItems() })
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
                    setSelectedIndexes(new Set([index]))
                    onMoveToFolderOpen({ items: [document] })
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
                    setSelectedIndexes(new Set([index]))
                    onMoveToFolderOpen({ items: [subfolder] })
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
            setLastSelectedIndex={setLastSelectedIndex}
            setSelectedIndexes={setSelectedIndexes}
            subfolders={subfolders}
            viewType={viewType}
          />
        </div>

        <DragOverlaySelection
          allItems={[...subfolders, ...documents]}
          collectionUseAsTitles={collectionUseAsTitles}
          lastSelected={lastSelectedIndex}
          selectedCount={selectedIndexes.size}
        />
      </DndContext>

      <RenameFolderDrawer
        drawerSlug={renameFolderDrawerSlug}
        folderToRename={folderToRename}
        onRenameConfirm={onRenameSuccess}
      />

      <MoveToFolderDrawer
        drawerSlug={moveToFolderDrawerSlug}
        hiddenFolderIDs={hiddenFolderIDs}
        onMoveConfirm={async (toFolderID) => {
          await moveToFolder({
            itemsToMove,
            toFolderID,
          })
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
