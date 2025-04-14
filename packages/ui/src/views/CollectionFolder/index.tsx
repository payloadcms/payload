'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useState } from 'react'

import { CloseModalButton } from '../../elements/CloseModalButton/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListFolderPills } from '../../elements/ListFolderPills/index.js'
import { ListHeader } from '../../elements/ListHeader/index.js'
import {
  ListBulkUploadButton,
  ListCreateNewDocInFolderButton,
} from '../../elements/ListHeader/TitleActions/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from './ListSelection/index.js'
import './index.scss'

const baseClass = 'collection-folder-list'
const drawerBaseClass = 'collection-folder-list-drawer'

export function DefaultCollectionFolderView(props: FolderListViewClientProps) {
  const {
    AfterFolderList,
    AfterFolderListTable,
    beforeActions,
    BeforeFolderList,
    BeforeFolderListTable,
    collectionSlug,
    columnState,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    hasCreatePermission: hasCreatePermissionFromProps,
    listMenuItems,
    renderedFilters,
    resolvedFilterOptions,
    Table: InitialTable,
  } = props

  const [Table, setTable] = useState(InitialTable)

  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const drawerDepth = useEditDepth()
  const { setStepNav } = useStepNav()
  const { clearRouteCache } = useRouteCache()
  const {
    allowCreate,
    DocumentDrawerToggler,
    drawerSlug: listDrawerSlug,
    isInDrawer,
    onBulkSelect,
    selectedOption,
  } = useListDrawerContext()
  const {
    breadcrumbs,
    collectionUseAsTitles,
    documents,
    folderCollectionConfig,
    getSelectedItems,
    lastSelectedIndex,
    moveToFolder,
    selectedIndexes,
    setFolderID,
    setIsDragging,
    subfolders,
  } = useFolder()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const hasCreatePermission =
    allowCreate !== undefined
      ? allowCreate && hasCreatePermissionFromProps
      : hasCreatePermissionFromProps
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
                  <FolderIcon />
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

  React.useEffect(() => {
    if (InitialTable) {
      setTable(InitialTable)
    }
  }, [InitialTable])

  const totalDocsAndSubfolders = documents.length + subfolders.length

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>
        <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
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
                  <ListFolderPills
                    collectionConfig={collectionConfig}
                    key="list-header-buttons"
                    viewType="folders"
                  />,
                ].filter(Boolean)}
                AfterListHeaderContent={Description}
                title={getTranslation(labels?.plural, i18n)}
                TitleActions={[
                  <ListCreateNewDocInFolderButton
                    buttonLabel={t('general:createNew')}
                    collectionSlugs={[collectionSlug]}
                    key="create-new-button"
                    onCreateSuccess={onCreateSuccess}
                  />,
                  <ListBulkUploadButton
                    collectionSlug={collectionSlug}
                    hasCreatePermission={hasCreatePermission}
                    isBulkUploadEnabled={isBulkUploadEnabled}
                    key="bulk-upload-button"
                  />,
                ].filter(Boolean)}
              />
            )}
            <ListControls
              beforeActions={
                enableRowSelections && typeof onBulkSelect === 'function'
                  ? beforeActions
                    ? [...beforeActions, <SelectMany key="select-many" onClick={onBulkSelect} />]
                    : [<SelectMany key="select-many" onClick={onBulkSelect} />]
                  : beforeActions
              }
              collectionConfig={collectionConfig}
              collectionSlug={collectionSlug}
              disableQueryPresets={true}
              listMenuItems={listMenuItems}
              renderedFilters={renderedFilters}
              resolvedFilterOptions={resolvedFilterOptions}
            />
            {BeforeFolderListTable}
            {totalDocsAndSubfolders > 0 && <RelationshipProvider>{Table}</RelationshipProvider>}
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
                    collectionSlugs={[collectionSlug]}
                    disableFolderCollection
                    key="create-document"
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
      </TableColumnsProvider>
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
