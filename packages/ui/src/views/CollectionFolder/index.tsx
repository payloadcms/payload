'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { CollectionSlug, Document, FolderListViewClientProps } from 'payload'
import type { FolderDocumentItemKey } from 'payload/shared'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { formatFolderOrDocumentItem } from 'payload/shared'
import React, { Fragment } from 'react'

import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js'
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { FolderFileTable } from '../../elements/FolderView/FolderFileTable/index.js'
import { ItemCardGrid } from '../../elements/FolderView/ItemCardGrid/index.js'
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js'
import { ToggleViewButtons } from '../../elements/FolderView/ToggleViewButtons/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListFolderPills } from '../../elements/ListFolderPills/index.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import {
  ListBulkUploadButton,
  ListCreateNewDocInFolderButton,
} from '../../elements/ListHeader/TitleActions/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from './ListSelection/index.js'
import './index.scss'

const baseClass = 'collection-folder-list'

export function DefaultCollectionFolderView(props: FolderListViewClientProps) {
  const {
    AfterFolderList,
    AfterFolderListTable,
    BeforeFolderList,
    BeforeFolderListTable,
    collectionSlug,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    hasCreatePermission,
    viewPreference,
  } = props

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { setPreference } = usePreferences()
  const {
    addItems,
    breadcrumbs,
    documents,
    filterItems,
    focusedRowIndex,
    folderCollectionConfig,
    folderCollectionSlug,
    folderFieldName,
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
  } = useFolder()

  const [activeView, setActiveView] = React.useState<'grid' | 'list'>(viewPreference || 'grid')

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig
  const isUploadCollection = Boolean(upload)
  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

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
      }
    },
    [moveToFolder, getSelectedItems],
  )

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
      void setPreference(`${collectionSlug}-collection-folder`, {
        viewPreference: view,
      })
      setActiveView(view)
    },
    [collectionSlug, setPreference],
  )

  React.useEffect(() => {
    if (!drawerDepth) {
      setStepNav([
        !breadcrumbs.length
          ? {
              label: (
                <div className={`${baseClass}__step-nav-icon-label`} key="root">
                  <ColoredFolderIcon />
                  {getTranslation(labels?.plural, i18n)}
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
                  {getTranslation(labels?.plural, i18n)}
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
  }, [setStepNav, labels, drawerDepth, i18n, breadcrumbs, setFolderID])

  const totalDocsAndSubfolders = documents.length + subfolders.length

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
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
              config.folders && collectionConfig.folders && (
                <ListFolderPills
                  collectionConfig={collectionConfig}
                  folderCollectionSlug={folderCollectionSlug}
                  key="list-header-buttons"
                  viewType="folders"
                />
              ),
            ].filter(Boolean)}
            AfterListHeaderContent={Description}
            title={getTranslation(labels?.plural, i18n)}
            TitleActions={[
              hasCreatePermission && (
                <ListCreateNewDocInFolderButton
                  buttonLabel={t('general:createNew')}
                  collectionSlugs={[folderCollectionConfig.slug, collectionSlug]}
                  key="create-new-button"
                  onCreateSuccess={onCreateSuccess}
                  slugPrefix="create-document--header-pill"
                />
              ),
              <ListBulkUploadButton
                collectionSlug={collectionSlug}
                hasCreatePermission={hasCreatePermission}
                isBulkUploadEnabled={isBulkUploadEnabled}
                key="bulk-upload-button"
              />,
            ].filter(Boolean)}
          />
          <SearchBar
            Actions={[
              <SortByPill key="sort-by-pill" />,
              <ToggleViewButtons
                activeView={activeView}
                key="toggle-view-buttons"
                setActiveView={handleSetViewType}
              />,
              <CurrentFolderActions key="current-folder-actions" />,
            ].filter(Boolean)}
            label={t('general:searchBy', {
              label: t('general:name'),
            })}
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
                  showRelationCell={false}
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
                <ListCreateNewDocInFolderButton
                  buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                  collectionSlugs={[collectionSlug]}
                  key="create-document"
                  onCreateSuccess={onCreateSuccess}
                  slugPrefix="create-document--no-results"
                />,
              ].filter(Boolean)}
              Message={
                <p>
                  {i18n.t('general:noResults', {
                    label: `${getTranslation(labels?.plural, i18n)} ${t('general:or').toLowerCase()} ${getTranslation(
                      folderCollectionConfig.labels?.plural,
                      i18n,
                    )}`,
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
