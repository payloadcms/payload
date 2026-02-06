'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { PREFERENCE_KEYS } from 'payload/shared'
import React, { Fragment } from 'react'

import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { ColoredFolderIcon } from '../../elements/FolderView/ColoredFolderIcon/index.js'
import { CurrentFolderActions } from '../../elements/FolderView/CurrentFolderActions/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { FilterFolderTypePill } from '../../elements/FolderView/FilterFolderTypePill/index.js'
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
import { FolderProvider, useFolder } from '../../providers/Folders/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../CollectionFolder/ListSelection/index.js'
import './index.scss'

const baseClass = 'folder-list'

export function DefaultBrowseByFolderView({
  activeCollectionFolderSlugs,
  allCollectionFolderSlugs,
  allowCreateCollectionSlugs,
  baseFolderPath,
  breadcrumbs,
  documents,
  folderFieldName,
  folderID,
  FolderResultsComponent,
  search,
  subfolders,
  ...restOfProps
}: FolderListViewClientProps) {
  return (
    <FolderProvider
      activeCollectionFolderSlugs={activeCollectionFolderSlugs}
      allCollectionFolderSlugs={allCollectionFolderSlugs}
      allowCreateCollectionSlugs={allowCreateCollectionSlugs}
      baseFolderPath={baseFolderPath}
      breadcrumbs={breadcrumbs}
      documents={documents}
      folderFieldName={folderFieldName}
      folderID={folderID}
      FolderResultsComponent={FolderResultsComponent}
      search={search}
      subfolders={subfolders}
    >
      <BrowseByFolderViewInContext {...restOfProps} />
    </FolderProvider>
  )
}

type BrowseByFolderViewInContextProps = Omit<
  FolderListViewClientProps,
  | 'activeCollectionFolderSlugs'
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

function BrowseByFolderViewInContext(props: BrowseByFolderViewInContextProps) {
  const {
    AfterFolderList,
    AfterFolderListTable,
    BeforeFolderList,
    BeforeFolderListTable,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    folderAssignedCollections,
    viewPreference,
  } = props

  const router = useRouter()
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()
  const { setPreference } = usePreferences()
  const {
    activeCollectionFolderSlugs: visibleCollectionSlugs,
    allowCreateCollectionSlugs,
    breadcrumbs,
    documents,
    dragOverlayItem,
    folderCollectionConfig,
    folderID,
    folderType,
    getFolderRoute,
    getSelectedItems,
    moveToFolder,
    refineFolderData,
    search,
    selectedItemKeys,
    setIsDragging,
    subfolders,
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

  const handleSetViewType = React.useCallback(
    (view: 'grid' | 'list') => {
      void setPreference(PREFERENCE_KEYS.BROWSE_BY_FOLDER, {
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
                    startRouteTransition(() => {
                      router.push(getFolderRoute(null))
                    })
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
                    startRouteTransition(() => {
                      router.push(getFolderRoute(crumb.id))
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
  }, [breadcrumbs, drawerDepth, getFolderRoute, router, setStepNav, startRouteTransition, t])

  const nonFolderCollectionSlugs = allowCreateCollectionSlugs.filter(
    (slug) => slug !== folderCollectionConfig.slug,
  )

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
                  folderAssignedCollections={folderAssignedCollections}
                  key="list-selection"
                />
              ),
            ].filter(Boolean)}
            AfterListHeaderContent={Description}
            title={listHeaderTitle}
            TitleActions={[
              allowCreateCollectionSlugs.length && (
                <ListCreateNewDocInFolderButton
                  buttonLabel={
                    allowCreateCollectionSlugs.length > 1
                      ? t('general:createNew')
                      : `${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`
                  }
                  collectionSlugs={allowCreateCollectionSlugs}
                  folderAssignedCollections={Array.isArray(folderType) ? folderType : []}
                  key="create-new-button"
                  onCreateSuccess={clearRouteCache}
                  slugPrefix="create-document--header-pill"
                />
              ),
            ].filter(Boolean)}
          />
          <SearchBar
            Actions={[
              <SortByPill key="sort-by-pill" />,
              folderID && <FilterFolderTypePill key="collection-type" />,
              <ToggleViewButtons
                activeView={activeView}
                key="toggle-view-buttons"
                setActiveView={handleSetViewType}
              />,
              <CurrentFolderActions key="current-folder-actions" />,
            ].filter(Boolean)}
            label={searchPlaceholder}
            onSearchChange={(search) => refineFolderData({ query: { search }, updateURL: true })}
            searchQueryParam={search}
          />
          {BeforeFolderListTable}
          {totalDocsAndSubfolders > 0 && (
            <>
              {activeView === 'grid' ? (
                <div>
                  {subfolders.length ? (
                    <>
                      <ItemCardGrid items={subfolders} title={'Folders'} type="folder" />
                    </>
                  ) : null}

                  {documents.length ? (
                    <>
                      <ItemCardGrid
                        items={documents}
                        subfolderCount={subfolders.length}
                        title={'Documents'}
                        type="file"
                      />
                    </>
                  ) : null}
                </div>
              ) : (
                <FolderFileTable />
              )}
            </>
          )}
          {totalDocsAndSubfolders === 0 && (
            <NoListResults
              Actions={[
                allowCreateCollectionSlugs.includes(folderCollectionConfig.slug) && (
                  <ListCreateNewDocInFolderButton
                    buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                    collectionSlugs={[folderCollectionConfig.slug]}
                    folderAssignedCollections={Array.isArray(folderType) ? folderType : []}
                    key="create-folder"
                    onCreateSuccess={clearRouteCache}
                    slugPrefix="create-folder--no-results"
                  />
                ),
                folderID && nonFolderCollectionSlugs.length > 0 && (
                  <ListCreateNewDocInFolderButton
                    buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                    collectionSlugs={nonFolderCollectionSlugs}
                    folderAssignedCollections={Array.isArray(folderType) ? folderType : []}
                    key="create-document"
                    onCreateSuccess={clearRouteCache}
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
