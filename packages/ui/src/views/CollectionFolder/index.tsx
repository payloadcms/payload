'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import { DefaultListViewTabs } from '../../elements/DefaultListViewTabs/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js'
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js'
import { ToggleViewButtons } from '../../elements/FolderView/ToggleViewButtons/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
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
import { FolderProvider, useFolder } from '../../providers/Folders/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import './index.scss'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from './ListSelection/index.js'

const baseClass = 'collection-folder-list'

export function DefaultCollectionFolderView({
  allCollectionFolderSlugs: folderCollectionSlugs,
  allowCreateCollectionSlugs,
  baseFolderPath,
  breadcrumbs,
  documents,
  folderFieldName,
  folderID,
  FolderResultsComponent,
  search,
  sort,
  subfolders,
  ...restOfProps
}: FolderListViewClientProps) {
  return (
    <FolderProvider
      allCollectionFolderSlugs={folderCollectionSlugs}
      allowCreateCollectionSlugs={allowCreateCollectionSlugs}
      baseFolderPath={baseFolderPath}
      breadcrumbs={breadcrumbs}
      documents={documents}
      folderFieldName={folderFieldName}
      folderID={folderID}
      FolderResultsComponent={FolderResultsComponent}
      search={search}
      sort={sort}
      subfolders={subfolders}
    >
      <CollectionFolderViewInContext {...restOfProps} />
    </FolderProvider>
  )
}

type CollectionFolderViewInContextProps = Omit<
  FolderListViewClientProps,
  | 'allCollectionFolderSlugs'
  | 'allowCreateCollectionSlugs'
  | 'baseFolderPath'
  | 'breadcrumbs'
  | 'documents'
  | 'folderFieldName'
  | 'folderID'
  | 'FolderResultsComponent'
  | 'subfolders'
>

function CollectionFolderViewInContext(props: CollectionFolderViewInContextProps) {
  const {
    AfterFolderList,
    AfterFolderListTable,
    BeforeFolderList,
    BeforeFolderListTable,
    collectionSlug,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    search,
    viewPreference,
  } = props

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { setPreference } = usePreferences()
  const {
    allowCreateCollectionSlugs,
    breadcrumbs,
    documents,
    dragOverlayItem,
    folderCollectionConfig,
    folderCollectionSlug,
    FolderResultsComponent,
    folderType,
    getSelectedItems,
    moveToFolder,
    refineFolderData,
    selectedItemKeys,
    setIsDragging,
    subfolders,
  } = useFolder()

  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()

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
        try {
          await moveToFolder({
            itemsToMove: getSelectedItems(),
            toFolderID: event.over.data.current.id,
          })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error moving items:', error)
        }

        clearRouteCache()
      }
    },
    [moveToFolder, getSelectedItems, clearRouteCache],
  )

  const handleSetViewType = React.useCallback(
    async (view: 'grid' | 'list') => {
      await setPreference(`${collectionSlug}-collection-folder`, {
        viewPreference: view,
      })
      clearRouteCache()
    },
    [collectionSlug, setPreference, clearRouteCache],
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
                    startRouteTransition(() => {
                      if (config.folders) {
                        router.push(
                          formatAdminURL({
                            adminRoute: config.routes.admin,
                            path: `/collections/${collectionSlug}/${config.folders.slug}`,
                          }),
                        )
                      }
                    })
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
                    startRouteTransition(() => {
                      if (config.folders) {
                        router.push(
                          formatAdminURL({
                            adminRoute: config.routes.admin,
                            path: `/collections/${collectionSlug}/${config.folders.slug}/${crumb.id}`,
                          }),
                        )
                      }
                    })
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
    breadcrumbs,
    collectionSlug,
    config.folders,
    config.routes.admin,
    config.serverURL,
    drawerDepth,
    i18n,
    labels?.plural,
    router,
    setStepNav,
    startRouteTransition,
  ])

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
                  disableBulkEdit={collectionConfig.disableBulkEdit ?? disableBulkEdit}
                  folderAssignedCollections={
                    Array.isArray(folderType) ? folderType : [collectionSlug]
                  }
                  key="list-selection"
                />
              ),
              <DefaultListViewTabs
                collectionConfig={collectionConfig}
                config={config}
                key="default-list-actions"
                viewType="folders"
              />,
            ].filter(Boolean)}
            AfterListHeaderContent={Description}
            title={getTranslation(labels?.plural, i18n)}
            TitleActions={[
              allowCreateCollectionSlugs.length && (
                <ListCreateNewDocInFolderButton
                  buttonLabel={
                    allowCreateCollectionSlugs.length > 1
                      ? t('general:createNew')
                      : `${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`
                  }
                  collectionSlugs={allowCreateCollectionSlugs}
                  folderAssignedCollections={
                    Array.isArray(folderType) ? folderType : [collectionSlug]
                  }
                  key="create-new-button"
                  onCreateSuccess={clearRouteCache}
                  slugPrefix="create-document--header-pill"
                />
              ),
              <ListBulkUploadButton
                collectionSlug={collectionSlug}
                hasCreatePermission={allowCreateCollectionSlugs.includes(collectionSlug)}
                isBulkUploadEnabled={isBulkUploadEnabled}
                key="bulk-upload-button"
              />,
            ].filter(Boolean)}
          />
          <SearchBar
            Actions={[
              <SortByPill key="sort-by-pill" />,
              <ToggleViewButtons
                activeView={viewPreference}
                key="toggle-view-buttons"
                setActiveView={handleSetViewType}
              />,
              <CurrentFolderActions key="current-folder-actions" />,
            ].filter(Boolean)}
            label={t('general:searchBy', {
              label: t('general:name'),
            })}
            onSearchChange={(search) => refineFolderData({ query: { search }, updateURL: true })}
            searchQueryParam={search}
          />
          {BeforeFolderListTable}
          {totalDocsAndSubfolders > 0 && FolderResultsComponent}
          {totalDocsAndSubfolders === 0 && (
            <NoListResults
              Actions={[
                allowCreateCollectionSlugs.includes(folderCollectionSlug) && (
                  <ListCreateNewDocInFolderButton
                    buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                    buttonSize="medium"
                    buttonStyle="primary"
                    collectionSlugs={[folderCollectionConfig.slug]}
                    folderAssignedCollections={
                      Array.isArray(folderType) ? folderType : [collectionSlug]
                    }
                    key="create-folder"
                    onCreateSuccess={clearRouteCache}
                    slugPrefix="create-folder--no-results"
                  />
                ),
                allowCreateCollectionSlugs.includes(collectionSlug) && (
                  <ListCreateNewDocInFolderButton
                    buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                    buttonSize="medium"
                    buttonStyle="primary"
                    collectionSlugs={[collectionSlug]}
                    folderAssignedCollections={
                      Array.isArray(folderType) ? folderType : [collectionSlug]
                    }
                    key="create-document"
                    onCreateSuccess={clearRouteCache}
                    slugPrefix="create-document--no-results"
                  />
                ),
              ].filter(Boolean)}
              Message={
                <>
                  <h3>{i18n.t('general:noResultsFound')}</h3>
                  <p>{i18n.t('general:noResultsDescription')}</p>
                </>
              }
            />
          )}
          {AfterFolderListTable}
        </Gutter>
        {AfterFolderList}
      </div>
      {selectedItemKeys.size > 0 && dragOverlayItem && (
        <DragOverlaySelection item={dragOverlayItem} selectedCount={selectedItemKeys.size} />
      )}
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
