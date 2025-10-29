'use client'

import type { TreeViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import { DefaultListViewTabs } from '../../elements/DefaultListViewTabs/index.js'
import { SortByPill } from '../../elements/FolderView/SortByPill/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { TreeViewProvider, useTreeView } from '../../providers/TreeView/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import './index.scss'

const baseClass = 'collection-tree-view-list'

export function DefaultCollectionTreeView({
  collectionSlug,
  expandedItemKeys,
  items,
  parentFieldName,
  search,
  sort,
  TreeViewComponent,
  ...restOfProps
}: TreeViewClientProps) {
  return (
    <TreeViewProvider
      collectionSlug={collectionSlug}
      expandedItemKeys={expandedItemKeys}
      items={items}
      parentFieldName={parentFieldName}
      search={search}
      sort={sort}
    >
      <CollectionTreeViewInContext
        {...restOfProps}
        collectionSlug={collectionSlug}
        TreeViewComponent={TreeViewComponent}
      />
    </TreeViewProvider>
  )
}

type CollectionTreeViewInContextProps = Omit<
  TreeViewClientProps,
  'breadcrumbs' | 'items' | 'parentFieldName' | 'search' | 'sort'
>

function CollectionTreeViewInContext(props: CollectionTreeViewInContextProps) {
  const {
    AfterTreeViewList,
    AfterTreeViewListTable,
    BeforeTreeViewList,
    BeforeTreeViewListTable,
    collectionSlug,
    Description,
    noResults,
    TreeViewComponent,
  } = props

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  const { search } = useTreeView()
  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig
  const isUploadCollection = Boolean(upload)
  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

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
          {!noResults && TreeViewComponent}
          {noResults && (
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
    </Fragment>
  )
}
