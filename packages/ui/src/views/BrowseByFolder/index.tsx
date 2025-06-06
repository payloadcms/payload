'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { CollectionSlug, Document, FolderListViewClientProps } from 'payload'
import type { FolderDocumentItemKey } from 'payload/shared'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { formatFolderOrDocumentItem } from 'payload/shared'
import React, { Fragment } from 'react'

import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { CollectionTypePill } from '../../elements/FolderView/CollectionTypePill/index.js'
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js'
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { FolderFileTable } from '../../elements/FolderView/FolderFileTable/index.js'
import { ItemCardGrid } from '../../elements/FolderView/ItemCardGrid/index.js'
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js'
import { ToggleViewButtons } from '../../elements/FolderView/ToggleViewButtons/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import { ListCreateNewDocInFolderButton } from '../../elements/ListHeader/TitleActions/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../CollectionFolder/ListSelection/index.js'
import './index.scss'

const baseClass = 'folder-list'

export function DefaultBrowseByFolderView(
  props: {
    hasCreatePermissionCollectionSlugs?: string[]
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
    hasCreatePermissionCollectionSlugs,
    viewPreference,
  } = props

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { clearRouteCache } = useRouteCache()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()
  const { setPreference } = usePreferences()
  const {
    addItems,
    breadcrumbs,
    documents,
    filterItems,
    focusedRowIndex,
    folderCollectionConfig,
    folderFieldName,
    folderID,
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

  const [activeView, setActiveView] = React.useState<'grid' | 'list'>(viewPreference || 'grid')
  const [searchPlaceholder] = React.useState(() => {
    const locationLabel =
      breadcrumbs.length === 0
        ? getTranslation(folderCollectionConfig.labels?.plural, i18n)
        : breadcrumbs[breadcrumbs.length - 1].name
    return t('folder:searchByNameInFolder', {
      folderName: locationLabel,
    })
  })

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
    ? t('folder:browseByFolder')
    : breadcrumbs[breadcrumbs.length - 1].name
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
    ({ collectionSlug, doc }: { collectionSlug: CollectionSlug; doc: Document }) => {
      const collectionConfig = getEntityConfig({ collectionSlug })
      void addItems([
        formatFolderOrDocumentItem({
          folderFieldName,
          isUpload: Boolean(collectionConfig?.upload),
          relationTo: collectionSlug,
          useAsTitle: collectionConfig.admin.useAsTitle,
          value: doc,
        }),
      ])
    },
    [getEntityConfig, addItems, folderFieldName],
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

  const handleSetViewType = React.useCallback(
    (view: 'grid' | 'list') => {
      void setPreference('browse-by-folder', {
        viewPreference: view,
      })
      setActiveView(view)
    },
    [setPreference],
  )

  React.useEffect(() => {
    if (!drawerDepth) {
      setStepNav([
        !breadcrumbs.length
          ? {
              label: (
                <div className={`${baseClass}__step-nav-icon-label`} key="root">
                  <ColoredFolderIcon />
                  {t('folder:browseByFolder')}
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
                  {t('folder:browseByFolder')}
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
  }, [setStepNav, drawerDepth, i18n, breadcrumbs, setFolderID, t])

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      <div className={`${baseClass} ${baseClass}--folders`}>
        {BeforeFolderList}
        <Gutter className={`${baseClass}__wrap`}>
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
                collectionSlugs={hasCreatePermissionCollectionSlugs}
                key="create-new-button"
                onCreateSuccess={onCreateSuccess}
                slugPrefix="create-document--header-pill"
              />,
            ].filter(Boolean)}
          />
          <SearchBar
            Actions={[
              <SortByPill key="sort-by-pill" />,
              folderID && <CollectionTypePill key="collection-type" />,
              <ToggleViewButtons
                activeView={activeView}
                key="toggle-view-buttons"
                setActiveView={handleSetViewType}
              />,
              <CurrentFolderActions key="current-folder-actions" />,
            ].filter(Boolean)}
            label={searchPlaceholder}
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
                  collectionSlugs={[folderCollectionConfig.slug]}
                  key="create-folder"
                  onCreateSuccess={onCreateSuccess}
                  slugPrefix="create-folder--no-results"
                />,
                folderID && (
                  <ListCreateNewDocInFolderButton
                    buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                    collectionSlugs={hasCreatePermissionCollectionSlugs.filter(
                      (slug) => slug !== folderCollectionConfig.slug,
                    )}
                    key="create-document"
                    onCreateSuccess={onCreateSuccess}
                    slugPrefix="create-document--no-results"
                  />
                ),
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
