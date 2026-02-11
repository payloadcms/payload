'use client'

import type { ClientUser, PaginatedDocs } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useState } from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'
import type { TaxonomyDocument } from '../../../elements/TaxonomyTree/types.js'
import type { SlotColumn } from './SlotTable.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
import { CreateDocumentButton } from '../../../elements/CreateDocumentButton/index.js'
import { Link } from '../../../elements/Link/index.js'
import { LoadMoreRow } from '../../../elements/LoadMoreRow/index.js'
import { Locked } from '../../../elements/Locked/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { useTaxonomy } from '../../../providers/Taxonomy/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { SlotTable } from './SlotTable.js'
import './index.scss'

const baseClass = 'taxonomy-table'

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

type RelatedGroup = {
  collectionSlug: string
  data: PaginatedDocs
  hasMany: boolean
  label: string
}

// Row type for tables
type TableRow = {
  [key: string]: unknown
  _collectionSlug: string
  _hasChildren?: boolean
  _isLocked?: boolean
  _userEditing?: ClientUser
  id: number | string
}

// Cell component for children (taxonomy items)
const ChildNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { getEntityConfig } = useConfig()
  const { isLocked } = useDocumentSelection()
  const { selectParent } = useTaxonomy()

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle = row[titleField] || row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const locked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })

  if (locked && row._userEditing) {
    return (
      <span className={`${baseClass}__name-link ${baseClass}__name-link--locked`}>
        <Locked user={row._userEditing} />
        <span className={`${baseClass}__name-text`}>{title}</span>
      </span>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    selectParent(row.id)
  }

  return (
    <button className={`${baseClass}__name-link`} onClick={handleClick} type="button">
      <TagIcon />
      <span className={`${baseClass}__name-text`}>{title}</span>
      {row._hasChildren && (
        <span className={`${baseClass}__chevron`}>
          <ChevronIcon direction="right" />
        </span>
      )}
    </button>
  )
}

// Cell component for related documents
const RelatedNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { getEntityConfig } = useConfig()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const { isLocked } = useDocumentSelection()

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle =
    typeof row[titleField] === 'string' || typeof row[titleField] === 'number'
      ? row[titleField]
      : row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const locked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })

  if (locked && row._userEditing) {
    return (
      <span className={`${baseClass}__name-link ${baseClass}__name-link--locked`}>
        <Locked user={row._userEditing} />
        <span className={`${baseClass}__name-text`}>{title}</span>
      </span>
    )
  }

  const editUrl = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}/${row.id}`,
  })

  return (
    <Link className={`${baseClass}__name-link`} href={editUrl}>
      <DocumentIcon />
      <span className={`${baseClass}__name-text`}>{title}</span>
    </Link>
  )
}

const DateCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { i18n } = useTranslation()

  if (!row.updatedAt || typeof row.updatedAt !== 'string') {
    return <span>—</span>
  }

  return <span>{formatDate(String(row.updatedAt), i18n.language)}</span>
}

export type TaxonomyTableProps = {
  childrenData?: PaginatedDocs<TaxonomyDocument>
  /** Collections available for creation (for empty state) */
  collections?: CollectionOption[]
  collectionSlug: string
  hasCreatePermission?: boolean
  parentFieldName?: string
  parentId: null | number | string
  relatedGroups: RelatedGroup[]
  search?: string
  taxonomyLabel: string
  useAsTitle: string
}

export function TaxonomyTable({
  childrenData,
  collections,
  collectionSlug,
  hasCreatePermission,
  parentFieldName,
  parentId,
  relatedGroups,
  search,
  taxonomyLabel,
  useAsTitle,
}: TaxonomyTableProps) {
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
        docs: unknown[]
        hasNextPage: boolean
        isLoading: boolean
        page: number
        totalDocs: number
      }
    >
  >(() => {
    const initial: Record<
      string,
      {
        docs: unknown[]
        hasNextPage: boolean
        isLoading: boolean
        page: number
        totalDocs: number
      }
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
        // Field name is always _t_{taxonomySlug} by convention
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

  // Column definitions for children
  const childColumns: SlotColumn<TableRow>[] = [
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
  ]

  // Column definitions for related documents
  const relatedColumns: SlotColumn<TableRow>[] = [
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
  ]

  if (!hasChildren && !hasRelated) {
    const canShowCreateButton = hasCreatePermission && collections && collections.length > 0

    return (
      <NoListResults
        Actions={
          canShowCreateButton
            ? [
                <CreateDocumentButton
                  collections={collections}
                  drawerSlug={`taxonomy-create-empty-${collectionSlug}`}
                  key="create"
                  onSave={clearRouteCache}
                />,
              ]
            : undefined
        }
        Message={<p>{t('general:noResults', { label: taxonomyLabel })}</p>}
      />
    )
  }

  return (
    <div className={baseClass}>
      {/* Children table (no title, not collapsible) */}
      {hasChildren && (
        <Collapsible
          className={`${baseClass}__section`}
          header={<h3 className={`${baseClass}__section-title`}>{taxonomyLabel}</h3>}
          key={`${collectionSlug}-${parentId}`}
        >
          <div>
            <SlotTable
              collectionSlug={collectionSlug}
              columns={childColumns}
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
              columns={relatedColumns}
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
