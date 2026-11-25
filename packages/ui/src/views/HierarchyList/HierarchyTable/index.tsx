'use client'

import type { HierarchyViewData, PaginatedDocs, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  combineWhereConstraints,
  DEFAULT_HIERARCHY_LIST_LIMIT,
  formatAdminURL,
  getBestFitFromSizes,
  isImage,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'
import type { HierarchyDocument } from '../../../elements/Hierarchy/Tree/types.js'
import type { DocumentLayout } from '../../../elements/LayoutToggle/index.js'
import type { SlotColumn } from './SlotTable.js'
import type { RelatedGroup, TableRow } from './types.js'

import { Button } from '../../../elements/Button/index.js'
import { CardGrid } from '../../../elements/CardGrid/index.js'
import { CreateDocumentButton } from '../../../elements/CreateDocumentButton/index.js'
import { DocumentCard } from '../../../elements/DocumentCard/index.js'
import { Link } from '../../../elements/Link/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { SimplePagination } from '../../../elements/Pagination/SimplePagination/index.js'
import { TableSection } from '../../../elements/TableSection/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { getHierarchyListURL } from '../getHierarchyListURL.js'
import { ChildNameCell } from './ChildNameCell.js'
import { DateCell } from './DateCell.js'
import { RelatedNameCell } from './RelatedNameCell.js'
import { SlotTable } from './SlotTable.js'
import { baseClass } from './types.js'
import './index.css'

// Top-level cell components to avoid nested component eslint errors
const NameCell: SlotColumn<TableRow>['Cell'] = (props) =>
  props.row._hasChildren !== undefined ? (
    <ChildNameCell {...props} />
  ) : (
    <RelatedNameCell {...props} />
  )

const CollectionCell: SlotColumn<TableRow>['Cell'] = ({ row }) => (
  <span>{row._collectionLabel}</span>
)

export type HierarchyTableProps = {
  childrenData?: PaginatedDocs<HierarchyDocument>
  /** Collections available for creation (for empty state) */
  collections?: CollectionOption[]
  collectionSlug: string
  hasCreatePermission?: boolean
  /** Resolved hierarchy icon component */
  HierarchyIcon?: React.ReactNode
  hierarchyLabel: string
  isLoadingDocuments?: boolean
  joinedDocuments?: HierarchyViewData['joinedDocuments']
  layout?: DocumentLayout
  onLoadMoreDocuments?: (onLastPage: () => void) => void
  parentId: null | number | string
  /** Base filters for related collections (keyed by collection slug) */
  relatedBaseFilters?: Record<string, Where>
  relatedGroups: RelatedGroup[]
  search?: string
}

export function HierarchyTable({
  childrenData,
  collections,
  collectionSlug,
  hasCreatePermission,
  HierarchyIcon,
  hierarchyLabel,
  isLoadingDocuments,
  joinedDocuments,
  layout = 'table',
  onLoadMoreDocuments,
  parentId,
  relatedBaseFilters,
  relatedGroups,
  search,
}: HierarchyTableProps) {
  const resultsRef = useRef<HTMLDivElement>(null)
  const { i18n, t } = useTranslation()
  const { clearRouteCache } = useRouteCache()
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const childDocs = childrenData?.docs

  // Related groups pagination state (per collection)
  const [relatedState, setRelatedState] = useState<
    Record<
      string,
      {
        isLoading: boolean
      } & Partial<PaginatedDocs>
    >
  >(() => {
    const initial: Record<
      string,
      {
        isLoading: boolean
      } & Partial<PaginatedDocs>
    > = {}
    for (const group of relatedGroups) {
      initial[group.collectionSlug] = {
        docs: group.data.docs,
        hasNextPage: group.data.hasNextPage,
        hasPrevPage: group.data.hasPrevPage || false,
        isLoading: false,
        limit: group.data.limit || DEFAULT_HIERARCHY_LIST_LIMIT,
        page: group.data.page || 1,
        pagingCounter: group.data.pagingCounter || 1,
        totalDocs: group.data.totalDocs,
        totalPages: group.data.totalPages || 1,
      }
    }
    return initial
  })

  // Get selection functions from context
  const { isLocked, isSelected, toggleAllInCollection, toggleSelection } = useDocumentSelection()

  // Get the user who is locking a row (for SlotTable to show lock icon instead of checkbox)
  const getRowLockedUser = useCallback(
    (row: TableRow) => {
      const locked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })
      return locked ? row._userEditing : undefined
    },
    [isLocked],
  )

  // Page change for a related collection
  const handlePageChangeRelated = useCallback(
    async (relatedSlug: string, page: number) => {
      const state = relatedState[relatedSlug]
      if (!state || state.isLoading) {
        return
      }

      // Find the group to get field info
      const group = relatedGroups.find((g) => g.collectionSlug === relatedSlug)
      if (!group) {
        return
      }

      setRelatedState((prev) => ({
        ...prev,
        [relatedSlug]: { ...prev[relatedSlug], isLoading: true },
      }))

      try {
        // Build relationship condition based on whether we're at root or in a parent
        let relationshipCondition: Record<string, unknown>
        if (parentId) {
          // Nested level: find documents assigned to this hierarchy item
          // "in" operator works for both hasMany and single relationship fields
          relationshipCondition = { [group.fieldName]: { in: [parentId] } }
        } else {
          // Root level: find documents where hierarchy field doesn't exist, is null, or is empty array
          const conditions: Record<string, unknown>[] = [
            { [group.fieldName]: { exists: false } },
            { [group.fieldName]: { equals: null } },
          ]
          if (group.hasMany) {
            // hasMany fields store cleared values as empty arrays
            conditions.push({ [group.fieldName]: { equals: [] } })
          }
          relationshipCondition = { or: conditions }
        }

        const relatedConfig = getEntityConfig({ collectionSlug: relatedSlug })
        const relatedUseAsTitle = relatedConfig?.admin?.useAsTitle || 'id'

        const searchCondition = search ? { [relatedUseAsTitle]: { like: search } } : undefined
        const relatedBaseFilter = relatedBaseFilters?.[relatedSlug]
        const where = combineWhereConstraints([
          relationshipCondition,
          searchCondition,
          relatedBaseFilter,
        ])

        const queryString = qs.stringify(
          { limit: DEFAULT_HIERARCHY_LIST_LIMIT, page, where },
          { addQueryPrefix: true },
        )
        const url = formatAdminURL({
          apiRoute,
          path: `/${relatedSlug}${queryString}`,
          serverURL,
        })

        const response = await fetch(url, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Failed to load page')
        }

        const result: PaginatedDocs = await response.json()

        setRelatedState((prev) => ({
          ...prev,
          [relatedSlug]: {
            docs: result.docs,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
            isLoading: false,
            limit: result.limit,
            page: result.page,
            pagingCounter: result.pagingCounter,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
          },
        }))
      } catch (_error) {
        setRelatedState((prev) => ({
          ...prev,
          [relatedSlug]: { ...prev[relatedSlug], isLoading: false },
        }))
      }
    },
    [
      apiRoute,
      getEntityConfig,
      parentId,
      relatedBaseFilters,
      relatedGroups,
      relatedState,
      search,
      serverURL,
    ],
  )

  // Get allowedCollections field name from hierarchy config
  const allowedCollectionsFieldName = useMemo(() => {
    const config = getEntityConfig({ collectionSlug })
    const hierarchy = config?.hierarchy

    if (hierarchy && typeof hierarchy === 'object' && hierarchy.collectionSpecific) {
      return hierarchy.collectionSpecific.fieldName
    }

    return undefined
  }, [collectionSlug, getEntityConfig])

  // Compute collection label for children (once)
  const childrenLabel = useMemo(
    () =>
      getTranslation(getEntityConfig({ collectionSlug })?.labels?.plural, i18n) || hierarchyLabel,
    [collectionSlug, getEntityConfig, hierarchyLabel, i18n],
  )

  // Build children data for table
  const childTableData: TableRow[] = useMemo(
    () =>
      childDocs?.map((doc) => ({
        ...doc,
        id: doc.id,
        _allowedCollections: allowedCollectionsFieldName
          ? (doc[allowedCollectionsFieldName] as string[] | undefined)
          : undefined,
        _collectionLabel: childrenLabel,
        _collectionSlug: collectionSlug,
        _hasChildren: Boolean(doc._hasChildren),
        _hierarchyIcon: HierarchyIcon,
      })) ?? [],
    [HierarchyIcon, allowedCollectionsFieldName, childDocs, childrenLabel, collectionSlug],
  )

  const hasChildren = childTableData.length > 0
  const hasRelated = joinedDocuments
    ? joinedDocuments.docs.length > 0
    : relatedGroups.some((g) => relatedState[g.collectionSlug]?.totalDocs > 0)

  // Unified groups array
  type GroupState = {
    docs: TableRow[]
    label: string
    pagination?: { data: PaginatedDocs; onChange: (page: number) => void }
    slug: string
  }

  const allGroups: GroupState[] = useMemo(() => {
    const groups: GroupState[] = []

    // Children group
    if (hasChildren) {
      groups.push({
        slug: collectionSlug,
        docs: childTableData,
        label: childrenLabel,
      })
    }

    // Related groups
    for (const group of relatedGroups) {
      const state = relatedState[group.collectionSlug]
      if (!state || state.totalDocs === 0) {
        continue
      }

      const relatedConfig = getEntityConfig({ collectionSlug: group.collectionSlug })
      const relatedLabel = getTranslation(relatedConfig?.labels?.plural, i18n) || group.label

      const relatedTableData: TableRow[] = state.docs.map((doc: Record<string, unknown>) => ({
        ...doc,
        id: doc.id as number | string,
        _collectionLabel: relatedLabel,
        _collectionSlug: group.collectionSlug,
      }))

      groups.push({
        slug: group.collectionSlug,
        docs: relatedTableData,
        label: relatedLabel,
        pagination: {
          data: {
            docs: state.docs || [],
            hasNextPage: state.hasNextPage || false,
            hasPrevPage: state.hasPrevPage || false,
            limit: state.limit || DEFAULT_HIERARCHY_LIST_LIMIT,
            page: state.page || 1,
            pagingCounter: state.pagingCounter || 1,
            totalDocs: state.totalDocs || 0,
            totalPages: state.totalPages || 1,
          },
          onChange: (page: number) => void handlePageChangeRelated(group.collectionSlug, page),
        },
      })
    }

    return groups
  }, [
    childrenLabel,
    childTableData,
    collectionSlug,
    getEntityConfig,
    handlePageChangeRelated,
    hasChildren,
    i18n,
    relatedGroups,
    relatedState,
  ])

  const combinedRows = useMemo(
    () => [
      ...allGroups.flatMap((group) => group.docs),
      ...(joinedDocuments?.docs ?? []).map((doc): TableRow => ({
        ...doc,
        _collectionLabel:
          getTranslation(
            getEntityConfig({ collectionSlug: doc._collectionSlug })?.labels?.plural,
            i18n,
          ) || doc._collectionSlug,
        _userEditing: doc._userEditing as TableRow['_userEditing'],
      })),
    ],
    [allGroups, getEntityConfig, i18n, joinedDocuments],
  )
  const documentRows = useMemo(
    () => combinedRows.filter((row) => row._collectionSlug !== collectionSlug),
    [collectionSlug, combinedRows],
  )

  const handleCheckboxChange = useCallback(
    (row: TableRow) => {
      toggleSelection({
        id: row.id,
        collectionSlug: row._collectionSlug,
        metadata: { allowedCollections: row._allowedCollections as string[] | undefined },
      })
    },
    [toggleSelection],
  )

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      for (const row of combinedRows) {
        if (
          !isLocked({ id: row.id, collectionSlug: row._collectionSlug }) &&
          isSelected({ id: row.id, collectionSlug: row._collectionSlug }) !== checked
        ) {
          handleCheckboxChange(row)
        }
      }
    },
    [combinedRows, handleCheckboxChange, isLocked, isSelected],
  )

  const getRowSelectionLabel = useCallback(
    (row: TableRow) => {
      const titleField = getEntityConfig({ collectionSlug: row._collectionSlug })?.admin?.useAsTitle
      const rawTitle = titleField ? row[titleField] : row.id
      const title =
        typeof rawTitle === 'string' || typeof rawTitle === 'number'
          ? String(rawTitle)
          : String(row.id)

      return t('general:selectLabel', { label: `${row._collectionLabel}: ${title}` })
    },
    [getEntityConfig, t],
  )

  const hierarchyConfig = getEntityConfig({ collectionSlug })?.hierarchy
  const isFolder =
    hierarchyConfig && typeof hierarchyConfig === 'object' && hierarchyConfig.allowHasMany === false
  const hierarchyParentFieldName =
    hierarchyConfig && typeof hierarchyConfig === 'object'
      ? hierarchyConfig.parentFieldName || 'parent'
      : 'parent'

  // Column definitions
  const columns: SlotColumn<TableRow>[] = useMemo(
    () => [
      {
        accessor: 'name',
        Cell: NameCell,
        className: `${baseClass}__col-name`,
        heading: t('general:name'),
        isLinked: true,
      },
      {
        accessor: 'collection',
        Cell: CollectionCell,
        className: `${baseClass}__col-collection`,
        heading: t('general:collection'),
      },
      {
        accessor: 'updatedAt',
        Cell: DateCell,
        className: `${baseClass}__col-date`,
        heading: t('general:updatedAt'),
      },
    ],
    [t],
  )

  const getGridItemClassName = (row: TableRow) =>
    isSelected({ id: row.id, collectionSlug: row._collectionSlug })
      ? 'card-grid__item--selected'
      : undefined

  const getRowKey = (row: TableRow) =>
    joinedDocuments ? `${row._collectionSlug}:${row.id}` : row.id

  const renderGridCard = (row: TableRow) => {
    const isHierarchyItem = row._collectionSlug === collectionSlug
    const config = getEntityConfig({ collectionSlug: row._collectionSlug })
    const titleField = config?.admin?.useAsTitle || 'id'
    const rawTitle = row[titleField]
    const title =
      typeof rawTitle === 'string' || typeof rawTitle === 'number'
        ? String(rawTitle)
        : String(row.id)
    const editURL = formatAdminURL({
      adminRoute,
      path: `/collections/${row._collectionSlug}/${encodeURIComponent(String(row.id))}`,
    })
    const hierarchyURL = getHierarchyListURL({
      adminRoute,
      collectionSlug,
      parentFieldName: hierarchyParentFieldName,
      parentID: row.id,
    })
    const mimeType = typeof row.mimeType === 'string' ? row.mimeType : undefined
    const thumbnailSrc =
      !isHierarchyItem && mimeType && isImage(mimeType)
        ? getBestFitFromSizes({
            sizes: row.sizes as Record<string, { url?: string; width?: number }>,
            thumbnailURL: row.thumbnailURL as string,
            url: row.url as string,
            width: row.width as number,
          })
        : !isHierarchyItem && typeof row.thumbnailURL === 'string'
          ? row.thumbnailURL
          : undefined
    const isRowLocked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })

    return (
      <DocumentCard
        href={isHierarchyItem ? hierarchyURL : editURL}
        isSelected={isSelected({ id: row.id, collectionSlug: row._collectionSlug })}
        onSelect={isRowLocked ? undefined : () => handleCheckboxChange(row)}
        placeholder={
          isHierarchyItem ? (
            (row._hierarchyIcon ?? (isFolder ? <FolderIcon /> : <TagIcon />))
          ) : (
            <DocumentIcon />
          )
        }
        thumbnail={thumbnailSrc ? { alt: '', src: thumbnailSrc } : undefined}
        title={title}
      >
        {isHierarchyItem ? (
          <Link aria-label={t('general:editLabel', { label: title })} href={editURL}>
            {t('general:edit')}
          </Link>
        ) : (
          row._collectionLabel
        )}
      </DocumentCard>
    )
  }

  if (!hasChildren && !hasRelated) {
    const canShowCreateButton = hasCreatePermission && collections && collections.length > 0

    return (
      <NoListResults
        Actions={
          canShowCreateButton
            ? [
                <CreateDocumentButton
                  buttonStyle="primary"
                  collections={collections}
                  drawerSlug={`hierarchy-create-empty-${collectionSlug}`}
                  key="create"
                  onSave={clearRouteCache}
                />,
              ]
            : undefined
        }
        description={t('general:noResultsDescription')}
        title={t('general:noResultsFound')}
        withMargin
      />
    )
  }

  const documentPagination = joinedDocuments?.hasNextPage && (
    <div
      aria-label={t('general:documents')}
      className={`${baseClass}__plane-pagination`}
      role="group"
    >
      <span className="sr-only" role="status">
        {joinedDocuments.docs.length} {t('general:of')} {joinedDocuments.totalDocs}
      </span>
      <Button
        buttonStyle="ghost"
        extraButtonProps={{
          'aria-busy': isLoadingDocuments,
          'aria-disabled': isLoadingDocuments,
        }}
        margin={false}
        onClick={(event) => {
          const button = event.currentTarget
          onLoadMoreDocuments?.(() => {
            if (document.activeElement === button) {
              resultsRef.current?.focus({ preventScroll: true })
            }
          })
        }}
      >
        {t(isLoadingDocuments ? 'general:loading' : 'general:loadMore')}
      </Button>
    </div>
  )

  const renderGrid = (docs: TableRow[], label: string) => (
    <CardGrid
      ariaLabel={label}
      getItemClassName={getGridItemClassName}
      getKey={getRowKey}
      items={docs}
      renderItem={renderGridCard}
    />
  )

  const renderTable = (
    docs: TableRow[],
    slug: string,
    onSelectAllChange: (checked: boolean) => void,
  ) => (
    <SlotTable
      collectionSlug={slug}
      columns={columns}
      data={docs}
      enableCheckbox={true}
      enableDragHandle={false}
      enableHeader={true}
      enableSelectAll={true}
      getRowId={getRowKey}
      getRowLockedUser={getRowLockedUser}
      getRowSelectionLabel={joinedDocuments ? getRowSelectionLabel : undefined}
      mergeCheckboxHeader={false}
      onCheckboxChange={handleCheckboxChange}
      onSelectAllChange={onSelectAllChange}
      parentId={parentId}
      selectedIds={
        new Set(
          docs
            .filter((row) => isSelected({ id: row.id, collectionSlug: row._collectionSlug }))
            .map(getRowKey),
        )
      }
    />
  )

  if (!joinedDocuments) {
    return (
      <div className={baseClass}>
        {allGroups.map((group) => (
          <TableSection key={group.slug}>
            <TableSection.Header heading={group.label}>
              {group.pagination && <SimplePagination {...group.pagination} />}
            </TableSection.Header>
            <TableSection.Content>
              {layout === 'grid'
                ? renderGrid(group.docs, group.label)
                : renderTable(group.docs, group.slug, () =>
                    toggleAllInCollection({ collectionSlug: group.slug }),
                  )}
            </TableSection.Content>
          </TableSection>
        ))}
      </div>
    )
  }

  return (
    <div
      aria-label={t('general:documents')}
      className={baseClass}
      ref={resultsRef}
      role="region"
      tabIndex={-1}
    >
      <TableSection>
        <TableSection.Content>
          {layout === 'table' ? (
            renderTable(combinedRows, collectionSlug, handleSelectAllChange)
          ) : (
            <div className={`${baseClass}__joined-grids`}>
              {hasChildren && renderGrid(childTableData, childrenLabel)}
              {hasRelated && renderGrid(documentRows, t('general:documents'))}
            </div>
          )}
          {documentPagination}
        </TableSection.Content>
      </TableSection>
    </div>
  )
}
