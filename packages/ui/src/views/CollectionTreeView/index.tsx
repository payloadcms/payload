'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { TreeViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { DefaultListViewTabs } from '../../elements/DefaultListViewTabs/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { TreeViewProvider, useTreeView } from '../../providers/TreeView/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import './index.scss'

const baseClass = 'collection-tree-view-list'

export function DefaultCollectionTreeView({
  collectionSlug,
  documents,
  parentFieldName,
  search,
  sort,
  TreeViewResultsComponent,
  ...restOfProps
}: TreeViewClientProps) {
  return (
    <TreeViewProvider
      collectionSlug={collectionSlug}
      documents={documents}
      parentFieldName={parentFieldName}
      search={search}
      sort={sort}
      TreeViewResultsComponent={TreeViewResultsComponent}
    >
      <CollectionTreeViewInContext {...restOfProps} collectionSlug={collectionSlug} />
    </TreeViewProvider>
  )
}

type CollectionTreeViewInContextProps = Omit<
  TreeViewClientProps,
  'breadcrumbs' | 'documents' | 'parentFieldName' | 'search' | 'sort' | 'TreeViewResultsComponent'
>

function CollectionTreeViewInContext(props: CollectionTreeViewInContextProps) {
  const {
    AfterTreeViewList,
    AfterTreeViewListTable,
    BeforeTreeViewList,
    BeforeTreeViewListTable,
    collectionSlug,
    Description,
    disableBulkDelete,
    disableBulkEdit,
  } = props

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { setPreference } = usePreferences()

  const {
    documents,
    dragOverlayItem,
    getSelectedItems,
    moveItems,
    refineTreeViewData,
    search,
    selectedItemKeys,
    setDragStartX,
    setIsDragging,
    TreeViewResultsComponent,
  } = useTreeView()

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

      if (
        event.over.data.current.type === 'tree-view-table' &&
        event.over.data.current.targetItem
      ) {
        try {
          // await moveItems({
          //   docIDs: getSelectedItems().map((doc) => doc.value.id),
          //   parentID: event.over.data.current.id,
          // })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error moving items:', error)
        }

        clearRouteCache()
      }
    },
    [moveItems, getSelectedItems, clearRouteCache],
  )

  // React.useEffect(() => {
  //   if (!drawerDepth) {
  //     setStepNav([
  //       !breadcrumbs.length
  //         ? {
  //             label: (
  //               <div className={`${baseClass}__step-nav-icon-label`} key="root">
  //                 <ColoredFolderIcon />
  //                 {getTranslation(labels?.plural, i18n)}
  //               </div>
  //             ),
  //           }
  //         : {
  //             label: (
  //               <DroppableBreadcrumb
  //                 className={[
  //                   `${baseClass}__step-nav-droppable`,
  //                   `${baseClass}__step-nav-icon-label`,
  //                 ]
  //                   .filter(Boolean)
  //                   .join(' ')}
  //                 id={null}
  //                 key="root"
  //                 onClick={() => {
  //                   startRouteTransition(() => {
  //                     if (config.folders) {
  //                       router.push(
  //                         formatAdminURL({
  //                           adminRoute: config.routes.admin,
  //                           path: `/collections/${collectionSlug}/${config.folders.slug}`,
  //                         }),
  //                       )
  //                     }
  //                   })
  //                 }}
  //               >
  //                 <ColoredFolderIcon />
  //                 {getTranslation(labels?.plural, i18n)}
  //               </DroppableBreadcrumb>
  //             ),
  //           },
  //       ...breadcrumbs.map((crumb, crumbIndex) => {
  //         return {
  //           label:
  //             crumbIndex === breadcrumbs.length - 1 ? (
  //               crumb.name
  //             ) : (
  //               <DroppableBreadcrumb
  //                 className={`${baseClass}__step-nav-droppable`}
  //                 id={crumb.id}
  //                 key={crumb.id}
  //                 onClick={() => {
  //                   startRouteTransition(() => {
  //                     if (config.folders) {
  //                       router.push(
  //                         formatAdminURL({
  //                           adminRoute: config.routes.admin,
  //                           path: `/collections/${collectionSlug}/${config.folders.slug}/${crumb.id}`,
  //                         }),
  //                       )
  //                     }
  //                   })
  //                 }}
  //               >
  //                 {crumb.name}
  //               </DroppableBreadcrumb>
  //             ),
  //         }
  //       }),
  //     ])
  //   }
  // }, [
  //   breadcrumbs,
  //   collectionSlug,
  //   config.folders,
  //   config.routes.admin,
  //   drawerDepth,
  //   i18n,
  //   labels?.plural,
  //   router,
  //   setStepNav,
  //   startRouteTransition,
  // ])

  return (
    <Fragment>
      <DndEventListener
        onDragEnd={onDragEnd}
        setDragStartX={setDragStartX}
        setIsDragging={setIsDragging}
      />

      <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
        {BeforeTreeViewList}
        <Gutter className={`${baseClass}__wrap`}>
          <ListHeader
            Actions={[
              // !smallBreak && <div>TODO: List actions go here</div>,
              <DefaultListViewTabs
                collectionConfig={collectionConfig}
                config={config}
                key="default-list-actions"
                viewType="collection-tree-view"
              />,
            ].filter(Boolean)}
            AfterListHeaderContent={Description}
            title={getTranslation(labels?.plural, i18n)}
            // TitleActions={[
            //   <ListBulkUploadButton
            //     collectionSlug={collectionSlug}
            //     hasCreatePermission={allowCreateCollectionSlugs.includes(collectionSlug)}
            //     isBulkUploadEnabled={isBulkUploadEnabled}
            //     key="bulk-upload-button"
            //   />,
            // ].filter(Boolean)}
          />
          <SearchBar
            Actions={[<SortByPill key="sort-by-pill" />].filter(Boolean)}
            label={t('general:searchBy', {
              label: t('general:name'),
            })}
            onSearchChange={(search) => {
              // refineFolderData({ query: { search }, updateURL: true })
            }}
            searchQueryParam={search}
          />
          {BeforeTreeViewListTable}
          {documents.length > 0 && TreeViewResultsComponent}
          {documents.length === 0 && (
            <NoListResults
              Actions={[
                // allowCreateCollectionSlugs.includes(folderCollectionSlug) && (
                //   <ListCreateNewDocInFolderButton
                //     buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                //     collectionSlugs={[folderCollectionConfig.slug]}
                //     folderAssignedCollections={
                //       Array.isArray(folderType) ? folderType : [collectionSlug]
                //     }
                //     key="create-folder"
                //     onCreateSuccess={clearRouteCache}
                //     slugPrefix="create-folder--no-results"
                //   />
                // ),
                // allowCreateCollectionSlugs.includes(collectionSlug) && (
                //   <ListCreateNewDocInFolderButton
                //     buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                //     collectionSlugs={[collectionSlug]}
                //     folderAssignedCollections={
                //       Array.isArray(folderType) ? folderType : [collectionSlug]
                //     }
                //     key="create-document"
                //     onCreateSuccess={clearRouteCache}
                //     slugPrefix="create-document--no-results"
                //   />
                // ),
              ].filter(Boolean)}
              Message={
                <p>
                  {i18n.t('general:noResults', {
                    label: `${getTranslation(labels?.plural, i18n)} ${t('general:or').toLowerCase()} ${getTranslation(
                      collectionConfig.labels?.plural,
                      i18n,
                    )}`,
                  })}
                </p>
              }
            />
          )}
          {AfterTreeViewListTable}
        </Gutter>
        {AfterTreeViewList}
      </div>
      {selectedItemKeys.size > 0 && dragOverlayItem && (
        <DragOverlaySelection item={dragOverlayItem} selectedCount={selectedItemKeys.size} />
      )}
    </Fragment>
  )
}

function DndEventListener({ onDragEnd, setDragStartX, setIsDragging }) {
  useDndMonitor({
    onDragCancel() {
      setIsDragging(false)
    },
    onDragEnd(event) {
      setIsDragging(false)
      onDragEnd(event)
    },
    onDragStart(event) {
      setIsDragging(true)
      // Capture the drag start X position from the active draggable's data
      if (event.active?.data?.current?.dragStartX !== undefined) {
        setDragStartX(event.active.data.current.dragStartX)
      }
    },
  })

  return null
}
