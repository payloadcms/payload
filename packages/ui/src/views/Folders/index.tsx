'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { CollectionSlug, FolderListViewClientProps } from 'payload'
import type { FolderDocumentItemKey, FolderOrDocument } from 'payload/shared'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import { CloseModalButton } from '../../elements/CloseModalButton/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { CollectionType } from '../../elements/FolderView/CollectionType/index.js'
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js'
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { FolderFileTable } from '../../elements/FolderView/FolderFileTable/index.js'
import { ItemCardGrid } from '../../elements/FolderView/ItemCardGrid/index.js'
import { ToggleViewButtons } from '../../elements/FolderView/ToggleViewButtons/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import { ListCreateNewDocInFolderButton } from '../../elements/ListHeader/TitleActions/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../CollectionFolder/ListSelection/index.js'
import './index.scss'

const baseClass = 'folder-list'
const drawerBaseClass = 'collection-folder-list-drawer'

export function DefaultFolderView(
  props: {
    selectedCollectionSlugs?: string[]
  } & FolderListViewClientProps,
) {
  const {
    AfterFolderList,
    AfterFolderListTable,
    BeforeFolderList,
    BeforeFolderListTable,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    hasCreatePermission: hasCreatePermissionFromProps,
  } = props

  const [activeView, setActiveView] = React.useState<'grid' | 'list'>('list')

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { clearRouteCache } = useRouteCache()
  const {
    allowCreate,
    DocumentDrawerToggler,
    drawerSlug: listDrawerSlug,
    isInDrawer,
    selectedOption,
  } = useListDrawerContext()
  const {
    addItems,
    breadcrumbs,
    documents,
    filterItems,
    focusedRowIndex,
    folderCollectionConfig,
    folderCollectionSlug,
    getSelectedItems,
    isDragging,
    lastSelectedIndex,
    moveToFolder,
    onItemClick,
    onItemKeyPress,
    search,
    selectedIndexes,
    setFolderID,
    setIsDragging,
    subfolders,
    visibleCollectionSlugs,
  } = useFolder()

  const hasCreatePermission =
    allowCreate !== undefined
      ? allowCreate && hasCreatePermissionFromProps
      : hasCreatePermissionFromProps

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

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
        clearRouteCache()
      }
    },
    [moveToFolder, getSelectedItems, clearRouteCache],
  )

  const totalDocsAndSubfolders = documents.length + subfolders.length
  const listHeaderTitle = !breadcrumbs.length
    ? 'Browse By Folder'
    : breadcrumbs[breadcrumbs.length - 1].name
  const allFolderCollectionSlugs = [
    folderCollectionSlug,
    ...Object.keys(config.folders.collections),
  ]
  const noResultsLabel = visibleCollectionSlugs.reduce((acc, slug, index, array) => {
    const collectionConfig = getEntityConfig({ collectionSlug: slug })
    if (index === 0) {
      return getTranslation(collectionConfig.labels?.plural, i18n)
    }
    if (index === array.length - 1) {
      return `${acc} ${t('general:or').toLowerCase()} ${getTranslation(collectionConfig.labels?.plural, i18n)}`
    }
    return `${acc}, ${getTranslation(collectionConfig.labels?.plural, i18n)}`
  }, '')

  const onCreateSuccess = React.useCallback(
    ({ collectionSlug, doc }: { collectionSlug: CollectionSlug; doc: Record<string, any> }) => {
      const collectionConfig = getEntityConfig({ collectionSlug })
      const itemValue: FolderOrDocument['value'] = {
        id: doc?.id,
        _folderOrDocumentTitle: doc?.[collectionConfig.admin.useAsTitle ?? 'id'],
        _parentFolder: doc?._parentFolder,
        createdAt: doc?.createdAt,
        updatedAt: doc?.updatedAt,
      }

      if (collectionConfig.upload) {
        itemValue.filename = doc?.filename
        itemValue.mimeType = doc?.mimeType
        itemValue.url = doc?.url
      }

      void addItems([
        {
          itemKey: `${collectionSlug}-${doc.id}`,
          relationTo: collectionSlug,
          value: itemValue,
        },
      ])
    },
    [getEntityConfig, addItems],
  )

  const selectedItemKeys = React.useMemo(() => {
    return new Set(
      getSelectedItems().reduce<FolderDocumentItemKey[]>((acc, item) => {
        if (item) {
          if (item.relationTo && item.value) {
            acc.push(`${item.relationTo}-${item.value.id}`)
          }
        }
        return acc
      }, []),
    )
  }, [getSelectedItems])

  React.useEffect(() => {
    if (!drawerDepth) {
      setStepNav([
        !breadcrumbs.length
          ? {
              label: (
                <div className={`${baseClass}__step-nav-icon-label`} key="root">
                  <ColoredFolderIcon />
                  {/* @todo: translate */}
                  Browse By Folder
                </div>
              ),
            }
          : {
              label: (
                <DroppableBreadcrumb
                  className={[
                    `${baseClass}__step-nav-droppable`,
                    `${baseClass}__step-nav-icon-label`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  id={null}
                  key="root"
                  onClick={() => {
                    void setFolderID({ folderID: null })
                  }}
                >
                  <ColoredFolderIcon />
                  {/* @todo: translate */}
                  Browse By Folder
                </DroppableBreadcrumb>
              ),
            },
        ...breadcrumbs.map((crumb, crumbIndex) => {
          return {
            label:
              crumbIndex === breadcrumbs.length - 1 ? (
                crumb.name
              ) : (
                <DroppableBreadcrumb
                  className={`${baseClass}__step-nav-droppable`}
                  id={crumb.id}
                  key={crumb.id}
                  onClick={() => {
                    void setFolderID({ folderID: crumb.id })
                  }}
                >
                  {crumb.name}
                </DroppableBreadcrumb>
              ),
          }
        }),
      ])
    }
  }, [
    setStepNav,
    drawerDepth,
    i18n,
    breadcrumbs,
    setFolderID,
    config.routes.admin,
    config.admin.routes.folders,
    config.serverURL,
  ])

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      <div className={`${baseClass} ${baseClass}--folders`}>
        {BeforeFolderList}
        <Gutter className={`${baseClass}__wrap`}>
          {isInDrawer ? (
            // The header within a drawer
            <ListHeader
              Actions={[<CloseModalButton key="close-button" slug={listDrawerSlug} />]}
              AfterListHeaderContent={Description}
              className={`${drawerBaseClass}__header`}
              title={getTranslation(
                getEntityConfig({ collectionSlug: selectedOption.value })?.labels?.plural,
                i18n,
              )}
              TitleActions={[
                hasCreatePermission && (
                  <DocumentDrawerToggler
                    className={`${drawerBaseClass}__create-new-button`}
                    key="create-new-button-toggler"
                  >
                    <Pill>{t('general:createNew')}</Pill>
                  </DocumentDrawerToggler>
                ),
              ].filter(Boolean)}
            />
          ) : (
            // The header not within a drawer
            <ListHeader
              Actions={[
                !smallBreak && (
                  <ListSelection
                    disableBulkDelete={disableBulkDelete}
                    disableBulkEdit={disableBulkEdit}
                    key="list-selection"
                  />
                ),
              ].filter(Boolean)}
              AfterListHeaderContent={Description}
              title={listHeaderTitle}
              TitleActions={[
                <ListCreateNewDocInFolderButton
                  buttonLabel={t('general:createNew')}
                  collectionSlugs={allFolderCollectionSlugs}
                  key="create-new-button"
                  onCreateSuccess={onCreateSuccess}
                />,
              ].filter(Boolean)}
            />
          )}
          <SearchBar
            Actions={[
              <CollectionType key="collection-type" />,
              <ToggleViewButtons
                activeView={activeView}
                key="toggle-view-buttons"
                setActiveView={setActiveView}
              />,
              <CurrentFolderActions key="current-folder-actions" />,
            ].filter(Boolean)}
            label="Test"
            onSearchChange={(search) => filterItems({ search })}
            searchQueryParam={search}
          />
          {BeforeFolderListTable}
          {totalDocsAndSubfolders > 0 && (
            <>
              {activeView === 'grid' ? (
                <div>
                  {subfolders.length ? (
                    <>
                      <ItemCardGrid
                        items={subfolders}
                        selectedItemKeys={selectedItemKeys}
                        title={'Folders'}
                        type="folder"
                      />
                    </>
                  ) : null}

                  {documents.length ? (
                    <>
                      <ItemCardGrid
                        items={documents}
                        selectedItemKeys={selectedItemKeys}
                        subfolderCount={subfolders.length}
                        title={'Documents'}
                        type="file"
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <FolderFileTable
                  dateFormat={config.admin.dateFormat}
                  documents={documents}
                  focusedRowIndex={focusedRowIndex}
                  i18n={i18n}
                  isMovingItems={isDragging}
                  onRowClick={onItemClick}
                  onRowPress={onItemKeyPress}
                  selectedItems={selectedItemKeys}
                  subfolders={subfolders}
                />
              )}
            </>
          )}
          {totalDocsAndSubfolders === 0 && (
            <NoListResults
              Actions={[
                <ListCreateNewDocInFolderButton
                  buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                  collectionSlugs={[]}
                  key="create-folder"
                  onCreateSuccess={onCreateSuccess}
                />,
                <ListCreateNewDocInFolderButton
                  buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                  collectionSlugs={allFolderCollectionSlugs}
                  disableFolderCollection
                  key="create-document"
                />,
              ].filter(Boolean)}
              Message={
                <p>
                  {i18n.t('general:noResults', {
                    label: noResultsLabel,
                  })}
                </p>
              }
            />
          )}
          {AfterFolderListTable}
        </Gutter>
        {AfterFolderList}
      </div>
      <DragOverlaySelection
        allItems={[...subfolders, ...documents]}
        lastSelected={lastSelectedIndex}
        selectedCount={selectedIndexes.size}
      />
    </Fragment>
  )
}
function DndEventListener({ onDragEnd, setIsDragging }) {
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
