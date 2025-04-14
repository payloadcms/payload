'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { CheckboxPopup } from '../../elements/CheckboxPopup/index.js'
import { CloseModalButton } from '../../elements/CloseModalButton/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import { ListCreateNewDocInFolderButton } from '../../elements/ListHeader/TitleActions/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { SearchBar } from '../../elements/SearchBar/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'

// import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../CollectionFolder/ListSelection/index.js'

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
    selectedCollectionSlugs: selectedCollectionSlugsFromProps,
    Table: InitialTable,
  } = props

  const [Table, setTable] = useState(InitialTable)

  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { handleSearchChange, mergeQuery, query } = useListQuery()
  const { startRouteTransition } = useRouteTransition()
  const router = useRouter()
  const { clearRouteCache } = useRouteCache()
  const {
    allowCreate,
    DocumentDrawerToggler,
    drawerSlug: listDrawerSlug,
    isInDrawer,
    selectedOption,
  } = useListDrawerContext()
  const {
    breadcrumbs,
    collectionUseAsTitles,
    documents,
    folderCollectionConfig,
    folderCollectionSlug,
    getSelectedItems,
    lastSelectedIndex,
    moveToFolder,
    selectedIndexes,
    setFolderID,
    setIsDragging,
    subfolders,
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

  const onCreateSuccess = React.useCallback(() => {
    if (!isInDrawer) {
      clearRouteCache()
    }
  }, [isInDrawer, clearRouteCache])

  React.useEffect(() => {
    if (!drawerDepth) {
      setStepNav([
        !breadcrumbs.length
          ? {
              label: (
                <div className={`${baseClass}__step-nav-icon-label`} key="root">
                  <FolderIcon />
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
                  <FolderIcon />
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
    mergeQuery,
    config.routes.admin,
    config.admin.routes.folders,
    config.serverURL,
    selectedCollectionSlugsFromProps,
  ])

  React.useEffect(() => {
    if (InitialTable) {
      setTable(InitialTable)
    }
  }, [InitialTable])

  const totalDocsAndSubfolders = documents.length + subfolders.length
  const listHeaderTitle = !breadcrumbs.length
    ? 'Browse By Folder'
    : breadcrumbs[breadcrumbs.length - 1].name
  const allFolderCollectionSlugs = [
    folderCollectionSlug,
    ...Object.keys(config.folders.collections),
  ]
  const selectedCollectionSlugs = selectedCollectionSlugsFromProps?.length
    ? selectedCollectionSlugsFromProps
    : allFolderCollectionSlugs
  const noResultsLabel = selectedCollectionSlugs.reduce((acc, slug, index, array) => {
    const collectionConfig = getEntityConfig({ collectionSlug: slug })
    if (index === 0) {
      return getTranslation(collectionConfig.labels?.plural, i18n)
    }
    if (index === array.length - 1) {
      return `${acc} ${t('general:or').toLowerCase()} ${getTranslation(collectionConfig.labels?.plural, i18n)}`
    }
    return `${acc}, ${getTranslation(collectionConfig.labels?.plural, i18n)}`
  }, '')

  const collectionOptions = allFolderCollectionSlugs.map((collectionSlug) => {
    const collectionConfig = getEntityConfig({ collectionSlug })
    return {
      label: getTranslation(collectionConfig.labels?.plural, i18n),
      value: collectionSlug,
    }
  })

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      {/* <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}> */}
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
              <CheckboxPopup
                Button={
                  <Button
                    buttonStyle="pill"
                    className={`${baseClass}__popup-button`}
                    el="div"
                    icon="chevron"
                    margin={false}
                    size="small"
                  >
                    Type
                  </Button>
                }
                key="relation-to-selection-popup"
                onChange={({ selectedValues }) => {
                  startRouteTransition(() =>
                    router.replace(
                      `${qs.stringify(
                        mergeQuery({
                          relationTo: selectedValues,
                        }),
                        { addQueryPrefix: true },
                      )}`,
                    ),
                  )
                }}
                options={collectionOptions}
                selectedValues={selectedCollectionSlugs}
              />,
              <div key="folder-view-as-grid">grid</div>,
              <div key="folder-view-as-list">list</div>,
            ].filter(Boolean)}
            label="Test"
            onSearchChange={handleSearchChange}
            searchQueryParam={query?.search}
          />
          {BeforeFolderListTable}
          {totalDocsAndSubfolders > 0 && <RelationshipProvider>{Table}</RelationshipProvider>}
          {totalDocsAndSubfolders === 0 && (
            <NoListResults
              Actions={[
                <ListCreateNewDocInFolderButton
                  buttonLabel={`${t('general:create')} ${getTranslation(folderCollectionConfig.labels?.singular, i18n).toLowerCase()}`}
                  collectionSlugs={allFolderCollectionSlugs}
                  key="create-folder"
                  onCreateSuccess={onCreateSuccess}
                />,
                <ListCreateNewDocInFolderButton
                  buttonLabel={`${t('general:create')} ${t('general:document').toLowerCase()}`}
                  collectionSlugs={[]}
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
      {/* </TableColumnsProvider> */}
      <DragOverlaySelection
        allItems={[...subfolders, ...documents]}
        collectionUseAsTitles={collectionUseAsTitles}
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
