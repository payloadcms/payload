'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, formatFilesize } from 'payload/shared'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import type { DocumentViewMode } from '../../elements/ViewModeToggle/index.js'
import type { TableRow } from '../HierarchyList/HierarchyTable/types.js'

import { Button } from '../../elements/Button/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListWhereBuilder } from '../../elements/ListWhereBuilder/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { PageControls } from '../../elements/PageControls/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { TableIdentityProvider } from '../../elements/Table/TableIdentity.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { ViewModeToggle } from '../../elements/ViewModeToggle/index.js'
import { useControllableState } from '../../hooks/useControllableState.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentSelectionProvider } from '../../providers/DocumentSelection/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { SelectionProvider, useSelection } from '../../providers/Selection/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../../views/List/ListSelection/index.js'
import { DocumentListSelection } from '../HierarchyList/DocumentListSelection/index.js'
import { getRowKey, HierarchyCardGrid } from '../HierarchyList/HierarchyCards/index.js'
import { HierarchyTable } from '../HierarchyList/HierarchyTable/index.js'
import { CollectionListHeader } from './ListHeader/index.js'
import './index.css'

const baseClass = 'collection-list'

type ListGridOrTableProps = {
  readonly collectionLabel: string
  readonly collectionSlug: string
  readonly docs: Record<string, unknown>[]
  readonly Table: React.ReactNode
  readonly viewMode: DocumentViewMode
}

/**
 * Renders the flat list's documents as a card grid or the default table, reusing the same
 * selection state so bulk actions stay consistent between view modes.
 */
function ListGridOrTable({
  collectionLabel,
  collectionSlug,
  docs,
  Table,
  viewMode,
}: ListGridOrTableProps) {
  const { selected, setSelection } = useSelection()

  if (viewMode !== 'grid') {
    return <RelationshipProvider>{Table}</RelationshipProvider>
  }

  const rows: TableRow[] = docs.map((doc) => ({
    ...doc,
    _collectionLabel: collectionLabel,
    _collectionSlug: collectionSlug,
  })) as TableRow[]

  const selectedKeys = new Set(
    rows.filter((row) => selected.get(row.id)).map((row) => getRowKey(row)),
  )

  // The flat list has one collection and no folders, so it is a single-band plane.
  const bands = [
    {
      isHierarchyGroup: false,
      key: 'documents',
      label: collectionLabel,
      rows,
    },
  ]

  // There are no folders and no hierarchy drop targets here, so the cards are select-only: dragging
  // one has nowhere to land, and the dragging fade would just read as a click flicker.
  return (
    <HierarchyCardGrid
      bands={bands}
      fillHeight
      getRowLockedUser={(row) => (row._isLocked ? row._userEditing : undefined)}
      isDragDisabled
      onSelectionChange={(row) => setSelection(row.id)}
      selectedKeys={selectedKeys}
    />
  )
}

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
    hasCreatePermission: hasCreatePermissionFromProps,
    hasDeletePermission,
    hasTrashPermission,
    hierarchyData,
    listMenuItems,
    listPreferences,
    newDocumentURL,
    NoResults,
    queryPreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
    Table: InitialTable,
    viewType,
  } = props

  const [Table] = useControllableState(InitialTable)

  const { allowCreate, createNewDrawerSlug, isInDrawer } = useListDrawerContext()

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

  const { data, hasActiveFilters, isGroupingBy, query } = useListQuery()

  const hasWhereParam = useRef(Boolean(query?.where))
  const [isWhereOpen, setIsWhereOpen] = useState(hasActiveFilters)
    <TableIdentityProvider collectionSlug={collectionSlug}>
      <Fragment>
        <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>
          <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
            <SelectionProvider docs={docs} totalDocs={data?.totalDocs}>
              {BeforeList}
              <CollectionListHeader
                collectionConfig={collectionConfig}
                Description={
                  Description || collectionConfig?.admin?.description ? (
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
                  ) : undefined
                }
                disableBulkDelete={disableBulkDelete}
                disableBulkEdit={disableBulkEdit}
                hasCreatePermission={hasCreatePermission}
                hasDeletePermission={hasDeletePermission}
                hasTrashPermission={hasTrashPermission}
                i18n={i18n}
                isBulkUploadEnabled={isBulkUploadEnabled && !upload.hideFileInputOnCreate}
                newDocumentURL={newDocumentURL}
                smallBreak={smallBreak}
                viewType={viewType}
              />
              <ListControls
                beforeActions={beforeActions}
                collectionConfig={collectionConfig}
                collectionSlug={collectionSlug}
                disableQueryPresets={
                  collectionConfig?.enableQueryPresets !== true || disableQueryPresets
                }
                hasCreatePermission={hasCreatePermission && viewType !== 'trash' && !isInDrawer}
                isWhereOpen={isWhereOpen}
                listMenuItems={listMenuItems}
                newDocumentURL={newDocumentURL}
                onWhereToggle={() => setIsWhereOpen((prev) => !prev)}
                queryPreset={queryPreset}
                queryPresetPermissions={queryPresetPermissions}
                renderedFilters={renderedFilters}
                resolvedFilterOptions={resolvedFilterOptions}
                viewModeToggle={
                  <ViewModeToggle onChange={handleViewModeChange} viewMode={viewMode} />
                }
              />
              {isWhereOpen && (
                <ListWhereBuilder
                  collectionPluralLabel={collectionConfig?.labels?.plural}
                  collectionSlug={collectionSlug}
                  fields={collectionConfig?.fields}
                  onEmptyRemove={() => setIsWhereOpen(false)}
                  renderedFilters={renderedFilters}
                  resolvedFilterOptions={resolvedFilterOptions}
                />
              )}
              {BeforeListTable}
              {hierarchyData ? (
                <DocumentSelectionProvider
                  collectionData={{
                    [collectionSlug]: { docs: hierarchyData.childrenData.docs },
                    ...Object.fromEntries(
                      Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                        ([slug, related]) => [slug, { docs: related.result.docs }],
                      ),
                    ),
                  }}
                >
                  <HierarchyTable
                    childrenData={hierarchyData.childrenData}
                    collectionSlug={collectionSlug}
                    hierarchyLabel={collectionLabel}
                    key={hierarchyData.parentId}
                    parentId={hierarchyData.parentId}
                    relatedGroups={Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                      ([slug, related]) => ({
                        collectionSlug: slug,
                        data: related.result,
                        fieldName: related.fieldName,
                        hasMany: related.hasMany,
                        label: related.label,
                      }),
                    )}
                    useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
                    viewMode={viewMode}
                  />
                  <DocumentListSelection
                    disableBulkDelete={disableBulkDelete}
                    disableBulkEdit={disableBulkEdit}
                  />
                </DocumentSelectionProvider>
              ) : docs?.length > 0 ? (
                <ListGridOrTable
                  collectionLabel={collectionLabel}
                  collectionSlug={collectionSlug}
                  docs={docs}
                  Table={Table}
                  viewMode={viewMode}
                />
              ) : null}
              {/* HierarchyTable handles its own empty state, skip for hierarchy views */}
              {docs?.length === 0 &&
                (NoResults ?? (
                  <NoListResults
                    Actions={
                      hasCreatePermission && newDocumentURL && viewType !== 'trash'
                        ? [
                            isInDrawer ? (
                              <Button
                                el="button"
                                key="create"
                                onClick={() => openModal(createNewDrawerSlug)}
                              >
                                {i18n.t('general:createNewLabel', {
                                  label: getTranslation(labels?.singular, i18n),
                                })}
                              </Button>
                            ) : (
                              <Button el="link" key="create" to={newDocumentURL}>
                                {i18n.t('general:createNewLabel', {
                                  label: getTranslation(labels?.singular, i18n),
                                })}
                              </Button>
                            ),
                          ]
                        : []
                    }
                    description={
                      viewType === 'trash'
                        ? i18n.t('general:noTrashResults', {
                            label: getTranslation(labels?.plural, i18n),
                          })
                        : i18n.t('general:noResultsDescription')
                    }
                    title={viewType !== 'trash' ? i18n.t('general:noResultsFound') : undefined}
                    withMargin
                  />
                ))}
              {AfterListTable}
              {AfterList}
              {docs?.length > 0 && !isGroupingBy && (
                <PageControls
                  AfterPageControls={
                    smallBreak ? (
                      <div className={`${baseClass}__list-selection`}>
                        <ListSelection
                          collectionConfig={collectionConfig}
                          disableBulkDelete={disableBulkDelete}
                          disableBulkEdit={disableBulkEdit}
                          label={collectionLabel}
                          showSelectAllAcrossPages={!isGroupingBy}
                        />
                        <div className={`${baseClass}__list-selection-actions`}>
                          {beforeActions}
                        </div>
                      </div>
                    ) : null
                  }
                  collectionConfig={collectionConfig}
                  tableId={hierarchyData ? undefined : `payload-table-${collectionConfig.slug}`}
                />
              )}
            </SelectionProvider>
          </div>
        </TableColumnsProvider>
      </Fragment>
    </TableIdentityProvider>
              isWhereOpen={isWhereOpen}
              listMenuItems={listMenuItems}
              newDocumentURL={newDocumentURL}
              onWhereToggle={() => setIsWhereOpen((prev) => !prev)}
              queryPreset={queryPreset}
              queryPresetPermissions={queryPresetPermissions}
              renderedFilters={renderedFilters}
              resolvedFilterOptions={resolvedFilterOptions}
              viewModeToggle={
                <ViewModeToggle onChange={handleViewModeChange} viewMode={viewMode} />
              }
            />
            {isWhereOpen && (
              <ListWhereBuilder
                collectionPluralLabel={collectionConfig?.labels?.plural}
                collectionSlug={collectionSlug}
                fields={collectionConfig?.fields}
                onEmptyRemove={() => setIsWhereOpen(false)}
                renderedFilters={renderedFilters}
                resolvedFilterOptions={resolvedFilterOptions}
              />
            )}
            {BeforeListTable}
            {hierarchyData ? (
              <DocumentSelectionProvider
                collectionData={{
                  [collectionSlug]: { docs: hierarchyData.childrenData.docs },
                  ...Object.fromEntries(
                    Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                      ([slug, related]) => [slug, { docs: related.result.docs }],
                    ),
                  ),
                }}
              >
                <HierarchyTable
                  childrenData={hierarchyData.childrenData}
                  collectionSlug={collectionSlug}
                  hierarchyLabel={collectionLabel}
                  key={hierarchyData.parentId}
                  parentId={hierarchyData.parentId}
                  relatedGroups={Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                    ([slug, related]) => ({
                      collectionSlug: slug,
                      data: related.result,
                      fieldName: related.fieldName,
                      hasMany: related.hasMany,
                      label: related.label,
                    }),
                  )}
                  useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
                  viewMode={viewMode}
                />
                <DocumentListSelection
                  disableBulkDelete={disableBulkDelete}
                  disableBulkEdit={disableBulkEdit}
                />
              </DocumentSelectionProvider>
            ) : docs?.length > 0 ? (
              <ListGridOrTable
                collectionLabel={collectionLabel}
                collectionSlug={collectionSlug}
                docs={docs}
                Table={Table}
                viewMode={viewMode}
              />
            ) : null}
            {/* HierarchyTable handles its own empty state, skip for hierarchy views */}
            {docs?.length === 0 &&
              (NoResults ?? (
                <NoListResults
                  Actions={
                    hasCreatePermission && newDocumentURL && viewType !== 'trash'
                      ? [
                          isInDrawer ? (
                            <Button
                              el="button"
                              key="create"
                              onClick={() => openModal(createNewDrawerSlug)}
                            >
                              {i18n.t('general:createNewLabel', {
                                label: getTranslation(labels?.singular, i18n),
                              })}
                            </Button>
                          ) : (
                            <Button el="link" key="create" to={newDocumentURL}>
                              {i18n.t('general:createNewLabel', {
                                label: getTranslation(labels?.singular, i18n),
                              })}
                            </Button>
                          ),
                        ]
                      : []
                  }
                  description={
                    viewType === 'trash'
                      ? i18n.t('general:noTrashResults', {
                          label: getTranslation(labels?.plural, i18n),
                        })
                      : i18n.t('general:noResultsDescription')
                  }
                  title={viewType !== 'trash' ? i18n.t('general:noResultsFound') : undefined}
                  withMargin
                />
              ))}
            {AfterListTable}
            {AfterList}
            {docs?.length > 0 && !isGroupingBy && (
              <PageControls
                AfterPageControls={
                  smallBreak ? (
                    <div className={`${baseClass}__list-selection`}>
                      <ListSelection
                        collectionConfig={collectionConfig}
                        disableBulkDelete={disableBulkDelete}
                        disableBulkEdit={disableBulkEdit}
                        label={collectionLabel}
                        showSelectAllAcrossPages={!isGroupingBy}
                      />
                      <div className={`${baseClass}__list-selection-actions`}>{beforeActions}</div>
                    </div>
                  ) : undefined
                }
                disableBulkDelete={disableBulkDelete}
                disableBulkEdit={disableBulkEdit}
                hasCreatePermission={hasCreatePermission}
                hasDeletePermission={hasDeletePermission}
                hasTrashPermission={hasTrashPermission}
                i18n={i18n}
                isBulkUploadEnabled={isBulkUploadEnabled && !upload.hideFileInputOnCreate}
                newDocumentURL={newDocumentURL}
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
                hasCreatePermission={hasCreatePermission && viewType !== 'trash' && !isInDrawer}
                hasDeletePermission={hasDeletePermission}
                isWhereOpen={isWhereOpen}
                listMenuItems={listMenuItems}
                newDocumentURL={newDocumentURL}
                onWhereToggle={() => setIsWhereOpen((prev) => !prev)}
                queryPreset={queryPreset}
                queryPresetPermissions={queryPresetPermissions}
                renderedFilters={renderedFilters}
                resolvedFilterOptions={resolvedFilterOptions}
                viewType={viewType}
              />
              {isWhereOpen && (
                <ListWhereBuilder
                  collectionPluralLabel={collectionConfig?.labels?.plural}
                  collectionSlug={collectionSlug}
                  fields={collectionConfig?.fields}
                  onEmptyRemove={() => setIsWhereOpen(false)}
                  renderedFilters={renderedFilters}
                  resolvedFilterOptions={resolvedFilterOptions}
                />
              )}
              {BeforeListTable}
              {hierarchyData ? (
                <DocumentSelectionProvider
                  collectionData={{
                    [collectionSlug]: { docs: hierarchyData.childrenData.docs },
                    ...Object.fromEntries(
                      Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                        ([slug, related]) => [slug, { docs: related.result.docs }],
                      ),
                    ),
                  }}
                >
                  <HierarchyTable
                    childrenData={hierarchyData.childrenData}
                    collectionSlug={collectionSlug}
                    hierarchyLabel={collectionLabel}
                    key={hierarchyData.parentId}
                    parentId={hierarchyData.parentId}
                    relatedGroups={Object.entries(hierarchyData.relatedDocumentsByCollection).map(
                      ([slug, related]) => ({
                        collectionSlug: slug,
                        data: related.result,
                        fieldName: related.fieldName,
                        hasMany: related.hasMany,
                        label: related.label,
                      }),
                    )}
                    useAsTitle={collectionConfig?.admin?.useAsTitle || 'id'}
                  />
                  <DocumentListSelection
                    disableBulkDelete={disableBulkDelete}
                    disableBulkEdit={disableBulkEdit}
                  />
                </DocumentSelectionProvider>
              ) : docs?.length > 0 ? (
                <RelationshipProvider>{Table}</RelationshipProvider>
              ) : null}
              {/* HierarchyTable handles its own empty state, skip for hierarchy views */}
              {docs?.length === 0 &&
                (NoResults ?? (
                  <NoListResults
                    Actions={
                      hasCreatePermission && newDocumentURL && viewType !== 'trash'
                        ? [
                            isInDrawer ? (
                              <Button
                                el="button"
                                key="create"
                                onClick={() => openModal(createNewDrawerSlug)}
                              >
                                {i18n.t('general:createNewLabel', {
                                  label: getTranslation(labels?.singular, i18n),
                                })}
                              </Button>
                            ) : (
                              <Button el="link" key="create" to={newDocumentURL}>
                                {i18n.t('general:createNewLabel', {
                                  label: getTranslation(labels?.singular, i18n),
                                })}
                              </Button>
                            ),
                          ]
                        : []
                    }
                    description={
                      viewType === 'trash'
                        ? i18n.t('general:noTrashResults', {
                            label: getTranslation(labels?.plural, i18n),
                          })
                        : i18n.t('general:noResultsDescription')
                    }
                    title={viewType !== 'trash' ? i18n.t('general:noResultsFound') : undefined}
                    withMargin
                  />
                ))}
              {AfterListTable}
              {AfterList}
              {docs?.length > 0 && !isGroupingBy && (
                <PageControls
                  AfterPageControls={
                    smallBreak ? (
                      <div className={`${baseClass}__list-selection`}>
                        <ListSelection
                          collectionConfig={collectionConfig}
                          disableBulkDelete={disableBulkDelete}
                          disableBulkEdit={disableBulkEdit}
                          label={collectionLabel}
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
                  tableId={hierarchyData ? undefined : `payload-table-${collectionConfig.slug}`}
                />
              )}
            </SelectionProvider>
          </div>
        </TableColumnsProvider>
        {docs?.length > 0 && isGroupingBy && data.totalPages > 1 && (
          <PageControls collectionConfig={collectionConfig} />
        )}
      </Fragment>
    </TableIdentityProvider>
  )
}
