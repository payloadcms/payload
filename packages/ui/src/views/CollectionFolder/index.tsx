'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useEffect, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { CloseModalButton } from '../../elements/CloseModalButton/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListFolderPills } from '../../elements/ListFolderPills/index.js'
import { CollectionListHeader } from '../../elements/ListHeader/index.js'
import {
  ListBulkUploadButton,
  ListCreateNewDocInFolderButton,
} from '../../elements/ListHeader/TitleActions/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
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
    newDocumentURL,
    renderedFilters,
    resolvedFilterOptions,
    Table: InitialTable,
  } = props

  const [Table, setTable] = useState(InitialTable)

  const {
    allowCreate,
    createNewDrawerSlug,
    DocumentDrawerToggler,
    drawerSlug: listDrawerSlug,
    isInDrawer,
    onBulkSelect,
    selectedOption,
  } = useListDrawerContext()

  const hasCreatePermission =
    allowCreate !== undefined
      ? allowCreate && hasCreatePermissionFromProps
      : hasCreatePermissionFromProps

  useEffect(() => {
    if (InitialTable) {
      setTable(InitialTable)
    }
  }, [InitialTable])

  const { getEntityConfig } = useConfig()

  const {
    breadcrumbs,
    collectionUseAsTitles,
    documents,
    getSelectedItems,
    lastSelectedIndex,
    moveToFolder,
    selectedIndexes,
    setIsDragging,
    subfolders,
  } = useFolder()
  const { openModal } = useModal()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig

  const isUploadCollection = Boolean(upload)

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const { i18n, t } = useTranslation()

  const drawerDepth = useEditDepth()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  useEffect(() => {
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
                >
                  {crumb.name}
                </DroppableBreadcrumb>
              ),
          }
        }),
      ])
    }
  }, [setStepNav, labels, drawerDepth, i18n, breadcrumbs])

  const totalDocsAndSubfolders = documents.length + subfolders.length

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

  return (
    <Fragment>
      <DndEventListener onDragEnd={onDragEnd} setIsDragging={setIsDragging} />
      <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>
        <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
          {BeforeFolderList}
          <Gutter className={`${baseClass}__wrap`}>
            {isInDrawer ? (
              <CollectionListHeader
                Actions={[<CloseModalButton key="close-button" slug={listDrawerSlug} />]}
                AfterListHeaderContent={Description}
                className={`${drawerBaseClass}__header`}
                collectionConfig={getEntityConfig({ collectionSlug: selectedOption.value })}
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
              <CollectionListHeader
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
                collectionConfig={collectionConfig}
                TitleActions={[
                  ListCreateNewDocInFolderButton({
                    collectionSlugs: [collectionSlug],
                  }),
                  ListBulkUploadButton({
                    collectionSlug,
                    hasCreatePermission,
                    isBulkUploadEnabled,
                  }),
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
              <div className={`${baseClass}__no-results`}>
                <p>
                  {i18n.t('general:noResults', { label: getTranslation(labels?.plural, i18n) })}
                </p>
                {hasCreatePermission && newDocumentURL && (
                  <Fragment>
                    {isInDrawer ? (
                      <Button el="button" onClick={() => openModal(createNewDrawerSlug)}>
                        {i18n.t('general:createNewLabel', {
                          label: getTranslation(labels?.singular, i18n),
                        })}
                      </Button>
                    ) : (
                      <Button el="link" to={newDocumentURL}>
                        {i18n.t('general:createNewLabel', {
                          label: getTranslation(labels?.singular, i18n),
                        })}
                      </Button>
                    )}
                  </Fragment>
                )}
              </div>
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
