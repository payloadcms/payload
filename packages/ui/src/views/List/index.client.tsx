'use client'

import type { ListViewClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, formatFilesize, getBestFitFromSizes, isImage } from 'payload/shared'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { CardGrid } from '../../elements/CardGrid/index.js'
import { DocumentCard } from '../../elements/DocumentCard/index.js'
import { ListControls } from '../../elements/ListControls/index.js'
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { ListWhereBuilder } from '../../elements/ListWhereBuilder/index.js'
import { useModal } from '../../elements/Modal/index.js'
import { NoListResults } from '../../elements/NoListResults/index.js'
import { PageControls } from '../../elements/PageControls/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { SelectMany } from '../../elements/SelectMany/index.js'
import { useStepNav } from '../../elements/StepNav/index.js'
import { RelationshipProvider } from '../../elements/Table/RelationshipProvider/index.js'
import { TableIdentityProvider } from '../../elements/Table/TableIdentity.js'
import { ViewDescription } from '../../elements/ViewDescription/index.js'
import { type DocumentViewMode, ViewModeToggle } from '../../elements/ViewModeToggle/index.js'
import { useControllableState } from '../../hooks/useControllableState.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentSelectionProvider } from '../../providers/DocumentSelection/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { SelectionProvider, useSelection } from '../../providers/Selection/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { ListSelection } from '../../views/List/ListSelection/index.js'
import { DocumentListSelection } from '../HierarchyList/DocumentListSelection/index.js'
import { HierarchyTable } from '../HierarchyList/HierarchyTable/index.js'
import { CollectionListHeader } from './ListHeader/index.js'
import './index.css'

const baseClass = 'collection-list'

const getDocumentID = (doc: Record<string, unknown>): string => {
  const id = doc.id

  return typeof id === 'string' || typeof id === 'number' ? String(id) : ''
}

type FlatDocumentGridProps = {
  readonly adminRoute: string
  readonly collectionLabel: string
  readonly collectionSlug: string
  readonly docs: Record<string, unknown>[]
  readonly useAsThumbnail?: string
  readonly useAsTitle?: string
}

const getDocumentTitle = ({
  doc,
  useAsTitle,
}: {
  doc: Record<string, unknown>
  useAsTitle?: string
}) => {
  const value = useAsTitle ? doc[useAsTitle] : undefined

  return typeof value === 'string' || typeof value === 'number' ? String(value) : getDocumentID(doc)
}

const getThumbnailDoc = ({
  doc,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}) => {
  const thumbnailValue = useAsThumbnail ? doc[useAsThumbnail] : undefined

  if (Array.isArray(thumbnailValue)) {
    return thumbnailValue[0] && typeof thumbnailValue[0] === 'object'
      ? (thumbnailValue[0] as Record<string, unknown>)
      : undefined
  }

  if (thumbnailValue && typeof thumbnailValue === 'object') {
    return thumbnailValue as Record<string, unknown>
  }

  return doc
}

const getThumbnail = ({
  doc,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}) => {
  const thumbnailDoc = getThumbnailDoc({ doc, useAsThumbnail })
  const mimeType = typeof thumbnailDoc.mimeType === 'string' ? thumbnailDoc.mimeType : undefined

  if (mimeType && isImage(mimeType)) {
    return getBestFitFromSizes({
      sizes: thumbnailDoc.sizes as Record<string, { url?: string; width?: number }>,
      thumbnailURL: thumbnailDoc.thumbnailURL as string,
      url: thumbnailDoc.url as string,
      width: thumbnailDoc.width as number,
    })
  }

  return typeof thumbnailDoc.thumbnailURL === 'string' ? thumbnailDoc.thumbnailURL : undefined
}

const FlatDocumentGrid: React.FC<FlatDocumentGridProps> = ({
  adminRoute,
  collectionLabel,
  collectionSlug,
  docs,
  useAsThumbnail,
  useAsTitle,
}) => {
  const { selected, setSelection } = useSelection()

  return (
    <CardGrid
      ariaLabel={collectionLabel}
      getItemClassName={(doc) => {
        const id = doc.id

        return (typeof id === 'string' || typeof id === 'number') && selected.get(id)
          ? 'card-grid__item--selected'
          : undefined
      }}
      getKey={getDocumentID}
      items={docs}
      renderItem={(doc) => {
        const id = doc.id
        const documentID = getDocumentID(doc)
        const thumbnailSrc = getThumbnail({ doc, useAsThumbnail })
        const title = getDocumentTitle({ doc, useAsTitle })

        return (
          <DocumentCard
            href={formatAdminURL({
              adminRoute,
              path: `/collections/${collectionSlug}/${encodeURIComponent(documentID)}`,
            })}
            isSelected={
              (typeof id === 'string' || typeof id === 'number') && Boolean(selected.get(id))
            }
            onSelect={
              typeof id === 'string' || typeof id === 'number' ? () => setSelection(id) : undefined
            }
            thumbnail={thumbnailSrc ? { alt: title, src: thumbnailSrc } : undefined}
            title={title}
          />
        )
      }}
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
    enableRowSelections,
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
  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    listPreferences?.documentViewMode ?? 'table',
  )

  const { allowCreate, createNewDrawerSlug, isInDrawer, onBulkSelect } = useListDrawerContext()
  const { getPreference, setPreference } = usePreferences()
  const router = useRouter()
  const viewModeChangeID = useRef(0)
  const viewModeUpdate = useRef(Promise.resolve())

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

  useEffect(() => {
    if (hasWhereParam.current && !query?.where) {
      hasWhereParam.current = false
      setIsWhereOpen(false)
    } else if (query?.where) {
      hasWhereParam.current = true
    }
  }, [query?.where])

  const { openModal } = useModal()

  const collectionConfig = getEntityConfig({ collectionSlug })

  const handleViewModeChange = async (nextViewMode: DocumentViewMode) => {
    const changeID = ++viewModeChangeID.current
    const preferencesKey = `collection-${collectionSlug}`

    setViewMode(nextViewMode)

    const update = viewModeUpdate.current.then(async () => {
      const preferences = await getPreference<Record<string, unknown>>(preferencesKey)

      await setPreference(
        preferencesKey,
        { ...(preferences || {}), documentViewMode: nextViewMode },
        false,
      )

      if (changeID === viewModeChangeID.current) {
        router.refresh()
      }
    })

    viewModeUpdate.current = update.catch(() => undefined)
    await update
  }

  const { labels, upload } = collectionConfig

  const isUploadCollection = Boolean(upload)

  const isBulkUploadEnabled = isUploadCollection && collectionConfig.upload.bulkUpload

  const isTrashEnabled = Boolean(collectionConfig.trash)

  const { i18n } = useTranslation()

  const collectionLabel = getTranslation(labels?.plural, i18n)

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

  useEffect(() => {
    if (!isInDrawer) {
      const baseLabel = {
        label: collectionLabel,
        url:
          hierarchyData || (isTrashEnabled && viewType === 'trash')
            ? formatAdminURL({
                adminRoute,
                path: `/collections/${collectionSlug}`,
              })
            : undefined,
      }

      const trashLabel = {
        label: i18n.t('general:trash'),
      }

      let navItems = isTrashEnabled && viewType === 'trash' ? [baseLabel, trashLabel] : [baseLabel]

      // Add hierarchy breadcrumbs
      if (hierarchyData?.breadcrumbs) {
        const queryParam = hierarchyData.parentFieldName || 'parent'
        const hierarchyBreadcrumbs = hierarchyData.breadcrumbs.map((crumb, index) => {
          const isLast = index === hierarchyData.breadcrumbs.length - 1
          return {
            label: crumb.title,
            url: isLast
              ? undefined
              : formatAdminURL({
                  adminRoute,
                  path: `/collections/${collectionSlug}?${queryParam}=${crumb.id}`,
                }),
          }
        })
        navItems = [...navItems, ...hierarchyBreadcrumbs]
      }

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
    hierarchyData,
    collectionLabel,
  ])

  return (
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
                viewModeToggle={
                  !collectionConfig.hierarchy && !hierarchyData && !isGroupingBy && !isInDrawer ? (
                    <ViewModeToggle onChange={handleViewModeChange} viewMode={viewMode} />
                  ) : undefined
                }
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
                !collectionConfig.hierarchy && viewMode === 'grid' ? (
                  <FlatDocumentGrid
                    adminRoute={adminRoute}
                    collectionLabel={collectionLabel}
                    collectionSlug={collectionSlug}
                    docs={docs}
                    useAsThumbnail={collectionConfig.admin.useAsThumbnail}
                    useAsTitle={collectionConfig.admin.useAsTitle}
                  />
                ) : (
                  <RelationshipProvider>{Table}</RelationshipProvider>
                )
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
