'use client'

import type { PaginatedDocs, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  combineWhereConstraints,
  DEFAULT_HIERARCHY_LIST_LIMIT,
  formatAdminURL,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useState } from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'
import type { HierarchyDocument } from '../../../elements/Hierarchy/Tree/types.js'
import type { SlotColumn } from './SlotTable.js'
import type { RelatedGroup, TableRow } from './types.js'

import { CreateDocumentButton } from '../../../elements/CreateDocumentButton/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { SimplePagination } from '../../../elements/Pagination/SimplePagination/index.js'
import { TableSection } from '../../../elements/TableSection/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
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
  /** Base filter applied to hierarchy collection queries (e.g., tenant filter) */
  baseFilter?: Where
  childrenData?: PaginatedDocs<HierarchyDocument>
  /** Collections available for creation (for empty state) */
  collections?: CollectionOption[]
  collectionSlug: string
  hasCreatePermission?: boolean
  /** Resolved hierarchy icon component */
  HierarchyIcon?: React.ReactNode
  hierarchyLabel: string
  parentFieldName?: string
  parentId: null | number | string
  /** Base filters for related collections (keyed by collection slug) */
  relatedBaseFilters?: Record<string, Where>
  relatedGroups: RelatedGroup[]
  search?: string
  useAsTitle: string
}

export function HierarchyTable({
  baseFilter,
  childrenData,
  collections,
  collectionSlug,
  hasCreatePermission,
  HierarchyIcon,
  hierarchyLabel,
  parentFieldName,
  parentId,
  relatedBaseFilters,
  relatedGroups,
  search,
  useAsTitle,
}: HierarchyTableProps) {
  const { i18n, t } = useTranslation()
  const { clearRouteCache } = useRouteCache()
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  // Children pagination state
  const [childDocs, setChildDocs] = useState(childrenData?.docs || [])
  const [childPaginationData, setChildPaginationData] = useState<Partial<PaginatedDocs>>({
    hasNextPage: childrenData?.hasNextPage || false,
    hasPrevPage: childrenData?.hasPrevPage || false,
    limit: childrenData?.limit || DEFAULT_HIERARCHY_LIST_LIMIT,
    page: childrenData?.page || 1,
    pagingCounter: childrenData?.pagingCounter || 1,
    totalDocs: childrenData?.totalDocs || 0,
    totalPages: childrenData?.totalPages || 1,
  })
  const [childLoading, setChildLoading] = useState(false)

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

  // Page change for children
  const handlePageChangeChildren = useCallback(
    async (page: number) => {
      if (childLoading) {
        return
      }

      setChildLoading(true)

      try {
        const parentCondition = parentId
          ? { [parentFieldName]: { equals: parentId } }
          : {
              or: [
                { [parentFieldName]: { exists: false } },
                { [parentFieldName]: { equals: null } },
              ],
            }

        const searchCondition = search ? { [useAsTitle]: { like: search } } : undefined
        const where = combineWhereConstraints([parentCondition, searchCondition, baseFilter])

        const queryString = qs.stringify(
          { limit: DEFAULT_HIERARCHY_LIST_LIMIT, page, where },
          { addQueryPrefix: true },
        )
        const url = formatAdminURL({
          apiRoute,
          path: `/${collectionSlug}${queryString}`,
          serverURL,
        })

        const response = await fetch(url, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Failed to load page')
        }

        const result: PaginatedDocs = await response.json()

        setChildDocs(result.docs)
        setChildPaginationData({
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          limit: result.limit,
          page: result.page,
          pagingCounter: result.pagingCounter,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
        })
      } catch (_error) {
        // Silently fail
      } finally {
        setChildLoading(false)
      }
    },
    [
      apiRoute,
      baseFilter,
      childLoading,
      collectionSlug,
      parentFieldName,
      parentId,
      search,
      serverURL,
      useAsTitle,
    ],
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
      parentFieldName,
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
      childDocs.map((doc) => ({
        ...doc,
        id: doc.id,
        _allowedCollections: allowedCollectionsFieldName
          ? (doc[allowedCollectionsFieldName] as string[] | undefined)
          : undefined,
        _collectionLabel: childrenLabel,
        _collectionSlug: collectionSlug,
        _hasChildren: Boolean(doc._hasChildren),
        _hierarchyIcon: HierarchyIcon,
      })),
    [HierarchyIcon, allowedCollectionsFieldName, childDocs, childrenLabel, collectionSlug],
  )

  const hasChildren = (childPaginationData.totalDocs || 0) > 0
  const hasRelated = relatedGroups.some((g) => relatedState[g.collectionSlug]?.totalDocs > 0)

  // Unified groups array
  type GroupState = {
    docs: TableRow[]
    isChildren: boolean
    isHierarchyEnabled: boolean
    isLoading: boolean
    label: string
    onCheckboxChange: (row: TableRow) => void
    onPageChange: (page: number) => void
    onSelectAllChange: () => void
    paginationData: PaginatedDocs
    slug: string
  }

  const allGroups: GroupState[] = useMemo(() => {
    const groups: GroupState[] = []

    // Children group
    if (hasChildren) {
      groups.push({
        slug: collectionSlug,
        docs: childTableData,
        isChildren: true,
        isHierarchyEnabled: true,
        isLoading: childLoading,
        label: childrenLabel,
        onCheckboxChange: (row: TableRow) =>
          toggleSelection({
            id: row.id,
            collectionSlug,
            metadata: {
              allowedCollections: row._allowedCollections as string[] | undefined,
            },
          }),
        onPageChange: (page: number) => void handlePageChangeChildren(page),
        onSelectAllChange: () => toggleAllInCollection({ collectionSlug }),
        paginationData: {
          docs: childDocs,
          hasNextPage: childPaginationData.hasNextPage || false,
          hasPrevPage: childPaginationData.hasPrevPage || false,
          limit: childPaginationData.limit || DEFAULT_HIERARCHY_LIST_LIMIT,
          page: childPaginationData.page || 1,
          pagingCounter: childPaginationData.pagingCounter || 1,
          totalDocs: childPaginationData.totalDocs || 0,
          totalPages: childPaginationData.totalPages || 1,
        },
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
        isChildren: false,
        isHierarchyEnabled: false,
        isLoading: state.isLoading,
        label: relatedLabel,
        onCheckboxChange: (row: TableRow) =>
          toggleSelection({
            id: row.id,
            collectionSlug: group.collectionSlug,
            metadata: {}, // Related items don't have allowedCollections - their collection slug is the constraint
          }),
        onPageChange: (page: number) => void handlePageChangeRelated(group.collectionSlug, page),
        onSelectAllChange: () => toggleAllInCollection({ collectionSlug: group.collectionSlug }),
        paginationData: {
          docs: state.docs || [],
          hasNextPage: state.hasNextPage || false,
          hasPrevPage: state.hasPrevPage || false,
          limit: state.limit || DEFAULT_HIERARCHY_LIST_LIMIT,
          page: state.page || 1,
          pagingCounter: state.pagingCounter || 1,
          totalDocs: state.totalDocs || 0,
          totalPages: state.totalPages || 1,
        },
      })
    }

    return groups
  }, [
    childDocs,
    childLoading,
    childPaginationData,
    childrenLabel,
    childTableData,
    collectionSlug,
    getEntityConfig,
    handlePageChangeChildren,
    handlePageChangeRelated,
    hasChildren,
    i18n,
    relatedGroups,
    relatedState,
    toggleAllInCollection,
    toggleSelection,
  ])

  // Column definitions
  const columns: SlotColumn<TableRow>[] = useMemo(
    () => [
      {
        accessor: 'name',
        Cell: NameCell,
        className: `${baseClass}__col-name`,
        heading: t('general:name'),
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

  if (!hasChildren && !hasRelated) {
    const canShowCreateButton = hasCreatePermission && collections && collections.length > 0

    return (
      <NoListResults
        Actions={
          canShowCreateButton
            ? [
                <CreateDocumentButton
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
      />
    )
  }

  return (
    <div className={baseClass}>
      {allGroups.map((group) => (
        <TableSection key={group.slug}>
          <TableSection.Header heading={group.label}>
            <SimplePagination data={group.paginationData} onChange={group.onPageChange} />
          </TableSection.Header>
          <TableSection.Content>
            <SlotTable
              collectionSlug={group.slug}
              columns={columns}
              data={group.docs}
              enableCheckbox={true}
              enableDragHandle={false}
              enableHeader={true}
              enableSelectAll={true}
              getRowLockedUser={getRowLockedUser}
              mergeCheckboxHeader={false}
              onCheckboxChange={group.onCheckboxChange}
              onSelectAllChange={group.onSelectAllChange}
              parentId={parentId}
              selectedIds={
                new Set(
                  group.docs
                    .filter((row) => isSelected({ id: row.id, collectionSlug: group.slug }))
                    .map((row) => row.id),
                )
              }
            />
          </TableSection.Content>
        </TableSection>
      ))}
    </div>
  )
}
