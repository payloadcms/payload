'use client'

import type { PaginatedDocs } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useState } from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'
import type { HierarchyDocument } from '../../../elements/HierarchyTree/types.js'
import type { SlotColumn } from './SlotTable.js'
import type { RelatedGroup, TableRow } from './types.js'

import { CreateDocumentButton } from '../../../elements/CreateDocumentButton/index.js'
import { LoadMoreRow } from '../../../elements/LoadMoreRow/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ChildNameCell } from './ChildNameCell.js'
import { DateCell } from './DateCell.js'
import { RelatedNameCell } from './RelatedNameCell.js'
import { SlotTable } from './SlotTable.js'
import { baseClass } from './types.js'
import './index.scss'

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
  parentFieldName?: string
  parentId: null | number | string
  relatedGroups: RelatedGroup[]
  search?: string
  useAsTitle: string
}

type GroupState = {
  docs: TableRow[]
  hasNextPage: boolean
  isChildren: boolean
  isLoading: boolean
  label: string
  onCheckboxChange: (row: TableRow) => void
  onLoadMore: () => void
  slug: string
  totalDocs: number
}

export function HierarchyTable({
  childrenData,
  collections,
  collectionSlug,
  hasCreatePermission,
  HierarchyIcon,
  hierarchyLabel,
  parentFieldName,
  parentId,
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
  const [childHasNext, setChildHasNext] = useState(childrenData?.hasNextPage || false)
  const [childPage, setChildPage] = useState(childrenData?.page || 1)
  const [childTotal, setChildTotal] = useState(childrenData?.totalDocs || 0)
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
        isLoading: false,
        page: group.data.page || 1,
        totalDocs: group.data.totalDocs,
      }
    }
    return initial
  })

  // Get selection functions from context
  const { isSelected, toggleSelection } = useDocumentSelection()

  // Load more children
  const handleLoadMoreChildren = useCallback(async () => {
    if (childLoading || !childHasNext) {
      return
    }

    setChildLoading(true)

    try {
      const parentCondition = parentId
        ? { [parentFieldName]: { equals: parentId } }
        : {
            or: [{ [parentFieldName]: { exists: false } }, { [parentFieldName]: { equals: null } }],
          }

      const where = search
        ? { and: [parentCondition, { [useAsTitle]: { like: search } }] }
        : parentCondition

      const queryString = qs.stringify(
        { limit: 10, page: childPage + 1, where },
        { addQueryPrefix: true },
      )
      const url = formatAdminURL({ apiRoute, path: `/${collectionSlug}${queryString}`, serverURL })

      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to load more')
      }

      const result: PaginatedDocs = await response.json()

      setChildDocs((prev) => [...prev, ...result.docs])
      setChildHasNext(result.hasNextPage)
      setChildPage(result.page || childPage + 1)
      setChildTotal(result.totalDocs)
    } catch (_error) {
      // Silently fail
    } finally {
      setChildLoading(false)
    }
  }, [
    apiRoute,
    childHasNext,
    childLoading,
    childPage,
    collectionSlug,
    parentFieldName,
    parentId,
    search,
    serverURL,
    useAsTitle,
  ])

  // Load more for a related collection
  const handleLoadMoreRelated = useCallback(
    async (relatedSlug: string) => {
      const state = relatedState[relatedSlug]
      if (!state || state.isLoading || !state.hasNextPage) {
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
        // Field name is always _t_{hierarchySlug} by convention
        const fieldName = `_t_${collectionSlug}`

        // "in" operator works for both hasMany and single relationship fields
        const whereClause = { [fieldName]: { in: [parentId] } }

        const relatedConfig = getEntityConfig({ collectionSlug: relatedSlug })
        const relatedUseAsTitle = relatedConfig?.admin?.useAsTitle || 'id'

        const where = search
          ? { and: [whereClause, { [relatedUseAsTitle]: { like: search } }] }
          : whereClause

        const queryString = qs.stringify(
          { limit: 10, page: state.page + 1, where },
          { addQueryPrefix: true },
        )
        const url = formatAdminURL({
          apiRoute,
          path: `/${relatedSlug}${queryString}`,
          serverURL,
        })

        const response = await fetch(url, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Failed to load more')
        }

        const result: PaginatedDocs = await response.json()

        setRelatedState((prev) => ({
          ...prev,
          [relatedSlug]: {
            docs: [...prev[relatedSlug].docs, ...result.docs],
            hasNextPage: result.hasNextPage,
            isLoading: false,
            page: result.page || prev[relatedSlug].page + 1,
            totalDocs: result.totalDocs,
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
      relatedGroups,
      relatedState,
      search,
      serverURL,
      collectionSlug,
    ],
  )

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
        _collectionLabel: childrenLabel,
        _collectionSlug: collectionSlug,
        _hasChildren: Boolean(doc._hasChildren),
        _hierarchyIcon: HierarchyIcon,
      })),
    [HierarchyIcon, childDocs, childrenLabel, collectionSlug],
  )

  const hasChildren = childTotal > 0
  const hasRelated = relatedGroups.some((g) => relatedState[g.collectionSlug]?.totalDocs > 0)

  // Unified groups array
  const allGroups: GroupState[] = useMemo(() => {
    const groups: GroupState[] = []

    // Children group
    if (hasChildren) {
      groups.push({
        slug: collectionSlug,
        docs: childTableData,
        hasNextPage: childHasNext,
        isChildren: true,
        isLoading: childLoading,
        label: childrenLabel,
        onCheckboxChange: (row: TableRow) => toggleSelection({ id: row.id, collectionSlug }),
        onLoadMore: () => void handleLoadMoreChildren(),
        totalDocs: childTotal,
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
        hasNextPage: state.hasNextPage,
        isChildren: false,
        isLoading: state.isLoading,
        label: relatedLabel,
        onCheckboxChange: (row: TableRow) =>
          toggleSelection({ id: row.id, collectionSlug: group.collectionSlug }),
        onLoadMore: () => void handleLoadMoreRelated(group.collectionSlug),
        totalDocs: state.totalDocs,
      })
    }

    return groups
  }, [
    childHasNext,
    childLoading,
    childrenLabel,
    childTableData,
    childTotal,
    collectionSlug,
    getEntityConfig,
    handleLoadMoreChildren,
    handleLoadMoreRelated,
    hasChildren,
    i18n,
    relatedGroups,
    relatedState,
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
        Message={
          <>
            <h3>{t('general:noResultsFound')}</h3>
            <p>{t('general:noResultsDescription')}</p>
          </>
        }
      />
    )
  }

  return (
    <div className={baseClass}>
      {allGroups.map((group, index) => (
        <React.Fragment key={group.slug}>
          {index > 0 && (
            <div className={`${baseClass}__group-label`}>
              <span>{group.label}</span>
            </div>
          )}
          <SlotTable
            collectionSlug={group.slug}
            columns={columns}
            data={group.docs}
            enableCheckbox={true}
            enableDragHandle={false}
            enableHeader={index === 0}
            enableSelectAll={false}
            mergeCheckboxHeader={true}
            onCheckboxChange={group.onCheckboxChange}
            parentId={parentId}
            selectedIds={
              new Set(
                group.docs
                  .filter((row) => isSelected({ id: row.id, collectionSlug: group.slug }))
                  .map((row) => row.id),
              )
            }
          />

          <div className={`${baseClass}__load-more-wrap`}>
            <LoadMoreRow
              currentCount={group.docs.length}
              hasMore={group.hasNextPage}
              isLoading={group.isLoading}
              onLoadMore={group.onLoadMore}
              totalDocs={group.totalDocs}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
