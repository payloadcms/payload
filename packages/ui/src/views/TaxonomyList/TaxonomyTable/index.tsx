'use client'

import type { PaginatedDocs } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import type { TaxonomyDocument } from '../../../elements/TaxonomyTree/types.js'
import type { SlotColumn } from './SlotTable.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
import { Link } from '../../../elements/Link/index.js'
import { LoadMoreRow } from '../../../elements/LoadMoreRow/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
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
  label: string
}

// Row type for tables
type TableRow = {
  [key: string]: unknown
  _collectionSlug: string
  _hasChildren?: boolean
  id: number | string
}

// Cell component for children (taxonomy items)
const ChildNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { getEntityConfig } = useConfig()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle = row[titleField] || row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const childUrl = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}?parent=${row.id}`,
  })

  return (
    <Link className={`${baseClass}__name-link`} href={childUrl}>
      <TagIcon />
      <span className={`${baseClass}__name-text`}>{title}</span>
      {row._hasChildren && (
        <span className={`${baseClass}__chevron`}>
          <ChevronIcon direction="right" />
        </span>
      )}
    </Link>
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

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle =
    typeof row[titleField] === 'string' || typeof row[titleField] === 'number'
      ? row[titleField]
      : row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

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
  childrenData: PaginatedDocs<TaxonomyDocument>
  collectionSlug: string
  parentId: null | number | string
  relatedGroups: RelatedGroup[]
  search?: string
  taxonomyLabel: string
  useAsTitle: string
}

export function TaxonomyTable({
  childrenData,
  collectionSlug,
  parentId,
  relatedGroups,
  search,
  taxonomyLabel,
  useAsTitle,
}: TaxonomyTableProps) {
  const { i18n, t } = useTranslation()
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const taxonomyConfig = getEntityConfig({ collectionSlug })
  const parentFieldName =
    typeof taxonomyConfig?.taxonomy === 'object'
      ? taxonomyConfig.taxonomy.parentFieldName || 'parent'
      : 'parent'

  // Children pagination state
  const [childDocs, setChildDocs] = useState(childrenData.docs)
  const [childHasNext, setChildHasNext] = useState(childrenData.hasNextPage)
  const [childPage, setChildPage] = useState(childrenData.page || 1)
  const [childTotal, setChildTotal] = useState(childrenData.totalDocs)
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

  // Selected rows (per table)
  const [selectedChildIds, setSelectedChildIds] = useState<Set<number | string>>(new Set())
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<
    Record<string, Set<number | string>>
  >(() => {
    const initial: Record<string, Set<number | string>> = {}
    for (const group of relatedGroups) {
      initial[group.collectionSlug] = new Set()
    }
    return initial
  })

  // Load more children
  const handleLoadMoreChildren = useCallback(async () => {
    if (childLoading || !childHasNext) {
      return
    }

    setChildLoading(true)

    try {
      const whereClause = parentId
        ? `where[${parentFieldName}][equals]=${parentId}`
        : `where[${parentFieldName}][exists]=false`

      const searchClause = search ? `&where[${useAsTitle}][like]=${encodeURIComponent(search)}` : ''

      const url = formatAdminURL({
        apiRoute,
        path: `/${collectionSlug}?${whereClause}${searchClause}&page=${childPage + 1}&limit=10`,
        serverURL,
      })

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

      setRelatedState((prev) => ({
        ...prev,
        [relatedSlug]: { ...prev[relatedSlug], isLoading: true },
      }))

      try {
        const relatedConfig = getEntityConfig({ collectionSlug: relatedSlug })
        const relationshipFields = findRelationshipFieldsTo(
          relatedConfig?.fields || [],
          collectionSlug,
        )

        const whereConditions = relationshipFields
          .map((fieldName) => `where[${fieldName}][in]=${parentId}`)
          .join('&')

        const relatedUseAsTitle = relatedConfig?.admin?.useAsTitle || 'id'
        const searchClause = search
          ? `&where[${relatedUseAsTitle}][like]=${encodeURIComponent(search)}`
          : ''

        const url = formatAdminURL({
          apiRoute,
          path: `/${relatedSlug}?${whereConditions}${searchClause}&page=${state.page + 1}&limit=10`,
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
    [apiRoute, collectionSlug, getEntityConfig, parentId, relatedState, search, serverURL],
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

  // Child selection handlers
  const handleChildCheckboxChange = (row: TableRow, checked: boolean) => {
    setSelectedChildIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(row.id)
      } else {
        next.delete(row.id)
      }
      return next
    })
  }

  // Related selection handlers
  const handleRelatedCheckboxChange = (slug: string, row: TableRow, checked: boolean) => {
    setSelectedRelatedIds((prev) => {
      const next = new Set(prev[slug])
      if (checked) {
        next.add(row.id)
      } else {
        next.delete(row.id)
      }
      return { ...prev, [slug]: next }
    })
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
    // empty state
    return null
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
              onCheckboxChange={handleChildCheckboxChange}
              parentId={parentId}
              selectedIds={selectedChildIds}
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
              onCheckboxChange={(row, checked) =>
                handleRelatedCheckboxChange(group.collectionSlug, row, checked)
              }
              selectedIds={selectedRelatedIds[group.collectionSlug]}
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

function findRelationshipFieldsTo(fields: unknown[], targetSlug: string): string[] {
  const fieldNames: string[] = []

  function traverse(fieldList: unknown[]): void {
    for (const field of fieldList) {
      if (!field || typeof field !== 'object') {
        continue
      }

      const f = field as Record<string, unknown>

      if (!('name' in f)) {
        continue
      }

      if (f.type === 'relationship') {
        const relationTo = Array.isArray(f.relationTo) ? f.relationTo : [f.relationTo]
        if (relationTo.includes(targetSlug)) {
          fieldNames.push(f.name as string)
        }
      } else if (f.type === 'group' && f.fields) {
        traverse(f.fields as unknown[])
      } else if (f.type === 'array' && f.fields) {
        traverse(f.fields as unknown[])
      } else if (f.type === 'blocks' && f.blocks) {
        for (const block of f.blocks as unknown[]) {
          if (block && typeof block === 'object' && 'fields' in block) {
            traverse((block as Record<string, unknown>).fields as unknown[])
          }
        }
      }
    }
  }

  traverse(fields)
  return fieldNames
}
