'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { FolderListViewClientProps } from 'payload'

import { useDndMonitor } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { Fragment, useEffect, useState } from 'react'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { DroppableBreadcrumb } from '../../elements/FolderView/Breadcrumbs/index.js'
import { DragOverlaySelection } from '../../elements/FolderView/DragOverlaySelection/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useModal } from '../../elements/Modal/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { TableColumnsProvider } from '../../elements/TableColumns/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListHeader } from './ListHeader/index.js'
import './index.scss'

const baseClass = 'collection-folder-list'

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
    drawerSlug: listDrawerSlug,
    onBulkSelect,
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
  const router = useRouter()

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
  const { setCollectionSlug, setCurrentActivePath, setOnSuccess } = useBulkUpload()
  const { drawerSlug: bulkUploadDrawerSlug } = useBulkUpload()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig

  const isUploadCollection = Boolean(upload)

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const isInDrawer = Boolean(listDrawerSlug)

  const { i18n, t } = useTranslation()

  const drawerDepth = useEditDepth()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const openBulkUpload = React.useCallback(() => {
    setCollectionSlug(collectionSlug)
    setCurrentActivePath(collectionSlug)
    openModal(bulkUploadDrawerSlug)
    setOnSuccess(collectionSlug, () => router.refresh())
  }, [
    router,
    collectionSlug,
    bulkUploadDrawerSlug,
    openModal,
    setCollectionSlug,
    setCurrentActivePath,
    setOnSuccess,
  ])

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
            <ListHeader
              collectionConfig={collectionConfig}
              Description={
                <div className={`${baseClass}__sub-header`}>
                  <RenderCustomComponent
                    CustomComponent={Description}
                    Fallback={
                      <ViewDescription
                        collectionSlug={collectionSlug}
                        description={collectionConfig?.admin?.description}
                      />
                    }
                  />
                </div>
              }
              disableBulkDelete={disableBulkDelete}
              disableBulkEdit={disableBulkEdit}
              hasCreatePermission={hasCreatePermission}
              i18n={i18n}
              isBulkUploadEnabled={isBulkUploadEnabled && !upload.hideFileInputOnCreate}
              newDocumentURL={newDocumentURL}
              openBulkUpload={openBulkUpload}
              smallBreak={smallBreak}
              t={t}
              viewType="folders"
            />
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
