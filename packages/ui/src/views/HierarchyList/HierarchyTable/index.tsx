'use client'

import type { PaginatedDocs } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useState } from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'
import type { HierarchyDocument } from '../../../elements/HierarchyTree/types.js'
import type { SlotColumn } from './SlotTable.js'
import type { RelatedGroup, TableRow } from './types.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
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

  // Build children data for table
  const childTableData: TableRow[] = childDocs.map((doc) => ({
    ...doc,
    id: doc.id,
    _collectionSlug: collectionSlug,
    _hasChildren: Boolean(doc._hasChildren),
    _hierarchyIcon: HierarchyIcon,
  }))

  const hasChildren = childTotal > 0
  const hasRelated = relatedGroups.some((g) => relatedState[g.collectionSlug]?.totalDocs > 0)

  // Child selection handler
  const handleChildCheckboxChange = (row: TableRow) => {
    toggleSelection({ id: row.id, collectionSlug })
  }

  // Related selection handler
  const handleRelatedCheckboxChange = (slug: string, row: TableRow) => {
    toggleSelection({ id: row.id, collectionSlug: slug })
  }

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
      {/* Children table (no title, not collapsible) */}
      {hasChildren && (
        <Collapsible
          className={`${baseClass}__section`}
          header={<h3 className={`${baseClass}__section-title`}>{hierarchyLabel}</h3>}
          key={`${collectionSlug}-${parentId}`}
        >
          <div>
            <SlotTable
              collectionSlug={collectionSlug}
              columns={[
                // Column definitions for children
                {
                  accessor: 'name',
                  Cell: ChildNameCell,
                  className: `${baseClass}__col-name`,
                  heading: t('general:name'),
                },
                {
                  accessor: 'updatedAt',
                  Cell: DateCell,
                  className: `${baseClass}__col-date`,
                  heading: t('general:updatedAt'),
                },
              ]}
              data={childTableData}
              enableCheckbox={true}
              enableDragHandle={false}
              enableSelectAll={false}
              mergeCheckboxHeader={true}
              onCheckboxChange={handleChildCheckboxChange}
              parentId={parentId}
              selectedIds={
                new Set(
                  childTableData
                    .filter((row) => isSelected({ id: row.id, collectionSlug }))
                    .map((row) => row.id),
                )
              }
            />

            <div className={`${baseClass}__load-more-wrap`}>
              <LoadMoreRow
                currentCount={childDocs.length}
                hasMore={childHasNext}
                isLoading={childLoading}
                onLoadMore={handleLoadMoreChildren}
                totalDocs={childTotal}
              />
            </div>
          </div>
        </Collapsible>
      )}

      {/* Related collection tables (collapsible with titles) */}
      {relatedGroups.map((group) => {
        const state = relatedState[group.collectionSlug]
        if (!state || state.totalDocs === 0) {
          return null
        }

        const relatedConfig = getEntityConfig({ collectionSlug: group.collectionSlug })
        const collectionLabel = getTranslation(relatedConfig?.labels?.plural, i18n) || group.label

        const relatedTableData: TableRow[] = state.docs.map((doc: Record<string, unknown>) => ({
          ...doc,
          id: doc.id as number | string,
          _collectionSlug: group.collectionSlug,
        }))

        return (
          <Collapsible
            className={`${baseClass}__section`}
            header={<h3 className={`${baseClass}__section-title`}>{collectionLabel}</h3>}
            key={group.collectionSlug}
          >
            <SlotTable
              columns={[
                // Column definitions for related documents
                {
                  accessor: 'name',
                  Cell: RelatedNameCell,
                  className: `${baseClass}__col-name`,
                  heading: t('general:name'),
                },
                {
                  accessor: 'updatedAt',
                  Cell: DateCell,
                  className: `${baseClass}__col-date`,
                  heading: t('general:updatedAt'),
                },
              ]}
              data={relatedTableData}
              enableCheckbox={true}
              enableDragHandle={false}
              enableSelectAll={false}
              mergeCheckboxHeader={true}
              onCheckboxChange={(row) => handleRelatedCheckboxChange(group.collectionSlug, row)}
              selectedIds={
                new Set(
                  relatedTableData
                    .filter((row) =>
                      isSelected({ id: row.id, collectionSlug: group.collectionSlug }),
                    )
                    .map((row) => row.id),
                )
              }
            />

            <div className={`${baseClass}__load-more-wrap`}>
              <LoadMoreRow
                currentCount={state.docs.length}
                hasMore={state.hasNextPage}
                isLoading={state.isLoading}
                onLoadMore={() => handleLoadMoreRelated(group.collectionSlug)}
                totalDocs={state.totalDocs}
              />
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}
