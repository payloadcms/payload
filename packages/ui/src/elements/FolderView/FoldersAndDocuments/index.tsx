'use client'
import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderInterface } from 'payload/shared'

import { DndContext, pointerWithin, useDndMonitor } from '@dnd-kit/core'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { PolymorphicRelationshipValue } from '../types.js'

import { GridViewIcon } from '../../../icons/GridView/index.js'
import { ListViewIcon } from '../../../icons/ListView/index.js'
import { SearchIcon } from '../../../icons/Search/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useListQuery } from '../../../providers/ListQuery/index.js'
import { usePreferences } from '../../../providers/Preferences/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ConfirmationModal } from '../../ConfirmationModal/index.js'
import { DocumentDrawer } from '../../DocumentDrawer/index.js'
import { Pagination } from '../../Pagination/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { SearchFilter } from '../../SearchFilter/index.js'
import { DisplayItems } from '../DisplayItems/index.js'
import { DragOverlaySelection } from '../DragOverlaySelection/index.js'
import { MoveToFolderDrawer } from '../Drawers/MoveToFolder/index.js'
import { NewFolderDrawer } from '../Drawers/NewFolder/index.js'
import { RenameFolderDrawer } from '../Drawers/RenameFolder/index.js'
import './index.scss'

const baseClass = 'folder-and-documents'
const renameFolderDrawerSlug = 'rename-folder'
const moveToFolderDrawerSlug = 'move-to-folder'
const deleteFolderItemsDrawerSlug = 'delete--folder-items-folder'
const newFolderSlug = 'new-folder'

type Props = {
  initialDisplayType: 'grid' | 'list'
}

export const FoldersAndDocuments = ({ initialDisplayType }: Props) => {
  const {
    breadcrumbs,
    clearSelections,
    collectionUseAsTitles,
    currentFolder,
    deleteCurrentFolder,
    documents,
    folderCollectionSlug,
    folderID,
    getSelectedItems,
    hasMoreDocuments,
    moveToFolder,
    populateFolderData,
    removeItems,
    selectedIndexes,
    setBreadcrumbs,
    setFolderID,
    setSubfolders,
    subfolders,
  } = useFolder()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const { setPreference } = usePreferences()
  const { closeModal, isModalOpen, openModal } = useModal()
  const { handlePageChange, handleSearchChange, query } = useListQuery()

  const [folderToRename, setFolderToRename] = React.useState<FolderInterface>()
  const [isDragging, setIsDragging] = React.useState(false)
  const [viewType, setViewType] = React.useState<'grid' | 'list'>(initialDisplayType || 'grid')
  const [createCollectionSlug, setCreateCollectionSlug] = React.useState<string | undefined>()
  const [itemsToMove, setItemsToMove] = React.useState<PolymorphicRelationshipValue[]>([])
  const [itemsToDelete, setItemsToDelete] = React.useState<PolymorphicRelationshipValue[]>([])
  const dndContextID = React.useId()
  const renameFolderWasOpenRef = React.useRef(false)

  const folderConfig = config.collections.find(
    (collection) => collection.slug === folderCollectionSlug,
  )

  const onDisplayTypeChange = React.useCallback(
    (newDisplayType: 'grid' | 'list') => {
      setViewType(newDisplayType)
      void setPreference('folder-view-display', newDisplayType)
    },
    [setPreference],
  )

  const onMoveToFolderOpen = React.useCallback(
    ({ items }: { items: PolymorphicRelationshipValue[] }) => {
      setItemsToMove(items)
      openModal(moveToFolderDrawerSlug)
    },
    [openModal],
  )

  const onDeleteFolderItemsOpen = React.useCallback(
    ({ items }: { items: PolymorphicRelationshipValue[] }) => {
      setItemsToDelete(items)
      openModal(deleteFolderItemsDrawerSlug)
    },
    [openModal],
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

      if (event.over.data.current.type === 'folder' && 'id' in event.over.data.current) {
        await moveToFolder({
          itemsToMove: getSelectedItems(),
          toFolderID: event.over.data.current.id || null,
        })
      }
    },
    [moveToFolder, getSelectedItems],
  )

  React.useEffect(() => {
    const renameModalIsOpen = isModalOpen(renameFolderDrawerSlug)
    if (renameFolderWasOpenRef.current && !renameModalIsOpen) {
      setFolderToRename(undefined)
      clearSelections()
    }

    renameFolderWasOpenRef.current = renameModalIsOpen
  }, [isModalOpen, setFolderToRename, clearSelections])

  return (
    <>
      <DndContext collisionDetection={pointerWithin} id={dndContextID}>
        <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />

        <div className={baseClass}>
          <div className={`${baseClass}__header`}>
            <div className={`${baseClass}__header-actions`}>
              {!folderID ? (
                <Button
                  buttonStyle="pill"
                  className={`${baseClass}__popup-button`}
                  onClick={() => {
                    openModal(newFolderSlug)
                  }}
                  size="small"
                >
                  {t('general:createNew')}
                </Button>
              ) : (
                <>
                  <Popup
                    button={
                      <Button
                        buttonStyle="pill"
                        className={`${baseClass}__popup-button`}
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
                        {getTranslation(folderConfig.labels.singular, i18n)}
                      </PopupList.Button>
                      {config.collections.map((collection, index) => {
                        if (config.folders.collections[collection.slug]) {
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

                  {folderID ? (
                    <Popup
                      button={
                        <Button
                          buttonStyle="pill"
                          className={`${baseClass}__popup-button`}
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
                          {t('folder:renameFolder')}
                        </PopupList.Button>
                        <PopupList.Button
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
                          {t('folder:moveFolder')}
                        </PopupList.Button>
                        <PopupList.Button
                          onClick={async () => {
                            await deleteCurrentFolder()
                          }}
                        >
                          {t('folder:deleteFolder')}
                        </PopupList.Button>
                      </PopupList.ButtonGroup>
                    </Popup>
                  ) : null}
                </>
              )}
            </div>

            {folderID ? (
              <div className={`${baseClass}__search-container`}>
                <div className={`${baseClass}__search-and-icon`}>
                  <SearchIcon />
                  <SearchFilter
                    handleChange={(search) => {
                      return void handleSearchChange(search)
                    }}
                    // @ts-expect-error @todo: fix types
                    initialParams={query}
                    label={'Search...'}
                  />
                </div>
                <div className={`${baseClass}__search-actions`}>
                  {selectedIndexes.size > 0 && (
                    <>
                      <Button
                        buttonStyle="pill"
                        onClick={() => {
                          onDeleteFolderItemsOpen({ items: getSelectedItems() })
                        }}
                        size="small"
                      >
                        {t('general:delete')} ({selectedIndexes.size})
                      </Button>
                      <Button
                        buttonStyle="pill"
                        onClick={() => {
                          onMoveToFolderOpen({ items: getSelectedItems() })
                        }}
                        size="small"
                      >
                        {t('general:moveCount', {
                          count: `(${selectedIndexes.size})`,
                          label: '',
                        })}
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
            ) : null}
          </div>

          <div className={`${baseClass}__data`}>
            <DisplayItems
              collectionUseAsTitles={collectionUseAsTitles}
              documents={documents}
              folderCollectionSlug={folderCollectionSlug}
              isMovingItems={isDragging}
              RenderDocumentActionGroup={({ document }) => (
                <PopupList.ButtonGroup>
                  <PopupList.Button
                    id="action-move-document"
                    onClick={() => {
                      onMoveToFolderOpen({ items: [document] })
                    }}
                  >
                    {t('general:move')}
                  </PopupList.Button>
                  <PopupList.Button
                    id="action-delete-document"
                    onClick={() => onDeleteFolderItemsOpen({ items: [document] })}
                  >
                    {t('folder:removeFromFolder')}
                  </PopupList.Button>
                </PopupList.ButtonGroup>
              )}
              RenderSubfolderActionGroup={({ subfolder }) => (
                <PopupList.ButtonGroup>
                  <PopupList.Button
                    id="action-rename-folder"
                    onClick={() => {
                      setFolderToRename(subfolder.value as FolderInterface)
                      openModal(renameFolderDrawerSlug)
                    }}
                  >
                    {t('general:rename')}
                  </PopupList.Button>
                  <PopupList.Button
                    id="action-move-folder"
                    onClick={() => {
                      onMoveToFolderOpen({ items: [subfolder] })
                    }}
                  >
                    {t('general:move')}
                  </PopupList.Button>
                  {folderID ? (
                    <PopupList.Button
                      id="action-delete-folder"
                      onClick={() => onDeleteFolderItemsOpen({ items: [subfolder] })}
                    >
                      {t('general:delete')}
                    </PopupList.Button>
                  ) : null}
                </PopupList.ButtonGroup>
              )}
              selectedItems={getSelectedItems()}
              setFolderID={setFolderID}
              subfolders={subfolders}
              viewType={viewType}
            />

            <Pagination
              hasNextPage={hasMoreDocuments}
              hasPrevPage={(parseInt(query?.page, 0) || 1) > 1}
              limit={parseInt(query?.limit, 0) || 10}
              onChange={(page) => {
                void handlePageChange(page)
              }}
              page={parseInt(query?.page, 0) || 1}
            />
          </div>
        </div>

        <DragOverlaySelection
          allItems={[...subfolders, ...documents]}
          collectionUseAsTitles={collectionUseAsTitles}
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
        itemsToMove={itemsToMove}
        onMoveConfirm={async (toFolderID) => {
          await moveToFolder({
            itemsToMove,
            toFolderID,
          })
          closeModal(moveToFolderDrawerSlug)
        }}
      />

      <ConfirmationModal
        body={t('folder:deleteConfirmation')}
        heading={`${t('general:aboutToDeleteCount', {
          count: itemsToDelete.length,
          label: itemsToDelete.length > 1 ? t('general:items') : t('general:item'),
        })}`}
        modalSlug={deleteFolderItemsDrawerSlug}
        onConfirm={async () => {
          await removeItems(itemsToDelete)
          closeModal(deleteFolderItemsDrawerSlug)
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
