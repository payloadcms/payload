'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL, formatFilesize } from 'payload/shared'
import React, { Fragment, useEffect } from 'react'

import { useBulkUpload } from '../../elements/BulkUpload/index.js'
import { Button } from '../../elements/Button/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useModal } from '../../elements/Modal/index.js'
import { PageControls } from '../../elements/PageControls/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { StickyToolbar } from '../../elements/StickyToolbar/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { useControllableState } from '../../hooks/useControllableState.js'
import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { SelectionProvider } from '../../providers/Selection/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../../views/List/ListSelection/index.js'
import { CollectionListHeader } from './ListHeader/index.js'
import './index.scss'

const baseClass = 'collection-list'

export function DefaultListView(props: ListViewClientProps) {
  const {
    AfterList,
    AfterListTable,
    beforeActions,
    BeforeList,
    BeforeListTable,
    collectionSlug,
    columnState,
    Description,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    enableRowSelections,
    hasCreatePermission: hasCreatePermissionFromProps,
    hasDeletePermission,
    listMenuItems,
    listSelectionItems,
    newDocumentURL,
    queryPreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
    Table: InitialTable,
    viewType,
  } = props

  const [Table] = useControllableState(InitialTable)

  const { allowCreate, createNewDrawerSlug, isInDrawer, onBulkSelect } = useListDrawerContext()

  const hasCreatePermission =
    allowCreate !== undefined
      ? allowCreate && hasCreatePermissionFromProps
      : hasCreatePermissionFromProps

  const {
    config: {
      routes: { admin: adminRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()
  const router = useRouter()

  const { data, isGroupingBy } = useListQuery()

  const { openModal } = useModal()
  const { drawerSlug: bulkUploadDrawerSlug, setCollectionSlug, setOnSuccess } = useBulkUpload()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const { labels, upload } = collectionConfig

  const isUploadCollection = Boolean(upload)

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const isTrashEnabled = Boolean(collectionConfig.trash)

  const { i18n } = useTranslation()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const docs = React.useMemo(() => {
    if (isUploadCollection) {
      return data.docs.map((doc) => {
        return {
          ...doc,
          filesize: formatFilesize(doc.filesize),
        }
      })
    } else {
      return data?.docs
    }
  }, [data?.docs, isUploadCollection])

  const openBulkUpload = React.useCallback(() => {
    setCollectionSlug(collectionSlug)
    openModal(bulkUploadDrawerSlug)
    setOnSuccess(() => router.refresh())
  }, [router, collectionSlug, bulkUploadDrawerSlug, openModal, setCollectionSlug, setOnSuccess])

  useEffect(() => {
    if (!isInDrawer) {
      const baseLabel = {
        label: getTranslation(labels?.plural, i18n),
        url:
          isTrashEnabled && viewType === 'trash'
            ? formatAdminURL({
                adminRoute,
                path: `/collections/${collectionSlug}`,
              })
            : undefined,
      }

      const trashLabel = {
        label: i18n.t('general:trash'),
      }

      const navItems =
        isTrashEnabled && viewType === 'trash' ? [baseLabel, trashLabel] : [baseLabel]

      setStepNav(navItems)
    }
  }, [
    adminRoute,
    setStepNav,
    serverURL,
    labels,
    isInDrawer,
    isTrashEnabled,
    viewType,
    i18n,
    collectionSlug,
  ])

  return (
    <Fragment>
      <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>
        <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
          <SelectionProvider docs={docs} totalDocs={data?.totalDocs}>
            {BeforeList}
            <Gutter className={`${baseClass}__wrap`}>
              <CollectionListHeader
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
                hasDeletePermission={hasDeletePermission}
                i18n={i18n}
                isBulkUploadEnabled={isBulkUploadEnabled && !upload.hideFileInputOnCreate}
                isTrashEnabled={isTrashEnabled}
                listSelectionItems={listSelectionItems}
                newDocumentURL={newDocumentURL}
                openBulkUpload={openBulkUpload}
                smallBreak={smallBreak}
                viewType={viewType}
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
                disableQueryPresets={
                  collectionConfig?.enableQueryPresets !== true || disableQueryPresets
                }
                listMenuItems={listMenuItems}
                queryPreset={queryPreset}
                queryPresetPermissions={queryPresetPermissions}
                renderedFilters={renderedFilters}
                resolvedFilterOptions={resolvedFilterOptions}
              />
              {BeforeListTable}
              {docs?.length > 0 && (
                <div className={`${baseClass}__tables`}>
                  <RelationshipProvider>{Table}</RelationshipProvider>
                </div>
              )}
              {docs?.length === 0 && (
                <div className={`${baseClass}__no-results`}>
                  <p>
                    {i18n.t(viewType === 'trash' ? 'general:noTrashResults' : 'general:noResults', {
                      label: getTranslation(labels?.plural, i18n),
                    })}
                  </p>
                  {hasCreatePermission && newDocumentURL && viewType !== 'trash' && (
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
              {AfterListTable}
              {docs?.length > 0 && !isGroupingBy && (
                <PageControls
                  AfterPageControls={
                    smallBreak ? (
                      <div className={`${baseClass}__list-selection`}>
                        <ListSelection
                          collectionConfig={collectionConfig}
                          disableBulkDelete={disableBulkDelete}
                          disableBulkEdit={disableBulkEdit}
                          label={getTranslation(collectionConfig.labels.plural, i18n)}
                          ListSelectionItems={listSelectionItems}
                          showSelectAllAcrossPages={!isGroupingBy}
                        />
                        <div className={`${baseClass}__list-selection-actions`}>
                          {enableRowSelections && typeof onBulkSelect === 'function'
                            ? beforeActions
                              ? [
                                  ...beforeActions,
                                  <SelectMany key="select-many" onClick={onBulkSelect} />,
                                ]
                              : [<SelectMany key="select-many" onClick={onBulkSelect} />]
                            : beforeActions}
                        </div>
                      </div>
                    ) : null
                  }
                  collectionConfig={collectionConfig}
                />
              )}
            </Gutter>
            {AfterList}
          </SelectionProvider>
        </div>
      </TableColumnsProvider>
      {docs?.length > 0 && isGroupingBy && data.totalPages > 1 && (
        <StickyToolbar>
          <PageControls collectionConfig={collectionConfig} />
        </StickyToolbar>
      )}
    </Fragment>
  )
}
