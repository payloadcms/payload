'use client'
import { getTranslation } from '@payloadcms/translations'
import { DEFAULT_HIERARCHY_TREE_LIMIT, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import type {
  ColumnItemData,
  ColumnState,
  HierarchyColumnBrowserProps,
  HierarchyColumnBrowserRef,
} from './types.js'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isSuperset } from '../../utilities/isSuperset.js'
import { Spinner } from '../Spinner/index.js'
import { Column } from './Column/index.js'
import './index.scss'

const baseClass = 'hierarchy-column-browser'

export const HierarchyColumnBrowser = function HierarchyColumnBrowser({
  ancestorsWithSelections,
  disabledIds,
  filterByCollection,
  hierarchyCollectionSlug,
  initialExpandedPath,
  isLoadingPath,
  onCreateNew,
  onSelect,
  parentFieldName,
  ref,
  selectedIds,
  useAsTitle = 'id',
}: { ref?: React.RefObject<HierarchyColumnBrowserRef | null> } & HierarchyColumnBrowserProps) {
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const treeLimit = hierarchyConfig?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT

  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.singular || hierarchyCollectionSlug, i18n)
    : hierarchyCollectionSlug
  const canCreate = Boolean(permissions?.collections?.[hierarchyCollectionSlug]?.create)

  const [columns, setColumns] = useState<ColumnState[]>([])
  const [expandedPath, setExpandedPath] = useState<(number | string)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const lastColumnRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef(false)

  const fetchItems = useCallback(
    async ({
      page,
      parentId,
    }: {
      page: number
      parentId: null | number | string
    }): Promise<{
      hasNextPage: boolean
      items: ColumnItemData[]
      totalDocs: number
    }> => {
      const parentWhere =
        parentId === null
          ? { [parentFieldName]: { exists: false } }
          : { [parentFieldName]: { equals: parentId } }

      // Build the final where clause, adding collectionSpecific filtering if configured
      let where: Record<string, unknown> = parentWhere

      // Filter by collection type if collectionSpecific is configured and filterByCollection is defined
      // - undefined: no filtering, show all folders
      // - [] empty: show all folders (no constraints)
      // - ['posts', ...]: show folders that allow ANY of these OR unrestricted
      // Note: Ideally we'd enforce ALL (superset) but hasMany enum fields in PG
      // do not support "contains all" queries easily
      if (hierarchyConfig?.collectionSpecific && filterByCollection !== undefined) {
        const typeFieldName = hierarchyConfig.collectionSpecific.fieldName

        if (filterByCollection.length > 0) {
          // Get all possible type field values from relatedCollections
          // This is used to detect "unrestricted" folders (empty allowedTypes array)
          const allPossibleTypes = Object.keys(hierarchyConfig.relatedCollections || {})

          where = {
            and: [
              parentWhere,
              {
                or: [
                  // items that allow ANY of the selected collections
                  { [typeFieldName]: { in: filterByCollection } },
                  // OR items that are unrestricted (no type field exists)
                  { [typeFieldName]: { exists: false } },
                  // OR items with empty allowedTypes array (unrestricted)
                  // Using not_in with all possible values matches empty arrays in both MongoDB and Postgres
                  ...(allPossibleTypes.length > 0
                    ? [{ [typeFieldName]: { not_in: allPossibleTypes } }]
                    : []),
                ],
              },
            ],
          }
        } else {
          // Empty array: show all items of this parent
          where = parentWhere
        }
      }

      const queryString = qs.stringify(
        { limit: treeLimit, page, sort: useAsTitle, where },
        { addQueryPrefix: true },
      )

      const url = formatAdminURL({
        apiRoute: api,
        path: `/${hierarchyCollectionSlug}${queryString}`,
        serverURL,
      })

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }

      const data = await response.json()

      const typeFieldName = hierarchyConfig?.collectionSpecific
        ? hierarchyConfig.collectionSpecific.fieldName
        : undefined

      const allItems: ColumnItemData[] = (data.docs || []).map(
        (doc: { id: number | string } & Record<string, unknown>) => ({
          id: doc.id,
          allowedCollections: typeFieldName
            ? (doc[typeFieldName] as string[] | undefined)
            : undefined,
          hasChildren: true, // Always allow expansion - empty children handled gracefully
          title: String(doc[useAsTitle] || doc.id),
        }),
      )

      // Client-side filter: only show items that are a superset of required collections
      // Server query uses ANY (due to PG limitations), but we want ALL (superset)
      const items =
        filterByCollection && filterByCollection.length > 0
          ? allItems.filter((item) => isSuperset(item.allowedCollections, filterByCollection))
          : allItems

      return {
        hasNextPage: data.hasNextPage || false,
        items,
        totalDocs: data.totalDocs || 0,
      }
    },
    [
      api,
      filterByCollection,
      hierarchyConfig,
      parentFieldName,
      serverURL,
      hierarchyCollectionSlug,
      treeLimit,
      useAsTitle,
    ],
  )

  const refreshColumn = useCallback(
    async (parentId: null | number | string) => {
      const columnIndex = columns.findIndex((col) => col.parentId === parentId)
      if (columnIndex === -1) {
        return
      }

      setColumns((prev) => {
        const updated = [...prev]
        updated[columnIndex] = { ...updated[columnIndex], isLoading: true }
        return updated
      })

      try {
        const { hasNextPage, items, totalDocs } = await fetchItems({ page: 1, parentId })

        setColumns((prev) => {
          const updated = [...prev]
          if (updated[columnIndex]) {
            updated[columnIndex] = {
              ...updated[columnIndex],
              hasNextPage,
              isLoading: false,
              items,
              page: 1,
              totalDocs,
            }
          }
          return updated
        })
      } catch {
        setColumns((prev) => {
          const updated = [...prev]
          if (updated[columnIndex]) {
            updated[columnIndex] = { ...updated[columnIndex], isLoading: false }
          }
          return updated
        })
      }
    },
    [columns, fetchItems],
  )

  useImperativeHandle(ref, () => ({ refreshColumn }), [refreshColumn])

  const loadColumns = useEffectEvent(async (path?: (number | string)[]) => {
    // Build list of parentIds to fetch: [null, ...path]
    const parentIds: (null | number | string)[] = [null]
    if (path?.length) {
      parentIds.push(...path)
    }

    // Set initial loading state for all columns
    setColumns(
      parentIds.map((parentId) => ({
        hasNextPage: false,
        isLoading: true,
        items: [],
        page: 1,
        parentId,
        totalDocs: 0,
      })),
    )

    // Set expanded path to match (excluding null/root)
    if (path?.length) {
      setExpandedPath(path)
    }

    // Fetch all columns in parallel
    const results = await Promise.all(
      parentIds.map(async (parentId, index) => {
        try {
          const { hasNextPage, items, totalDocs } = await fetchItems({ page: 1, parentId })
          let parentTitle: string | undefined
          if (index > 0 && parentId !== null) {
            // Will be filled in after all fetches complete
          }
          return {
            hasNextPage,
            isLoading: false,
            items,
            page: 1,
            parentId,
            parentTitle,
            totalDocs,
          }
        } catch {
          return {
            hasNextPage: false,
            isLoading: false,
            items: [],
            page: 1,
            parentId,
            parentTitle: undefined,
            totalDocs: 0,
          }
        }
      }),
    )

    // Fill in parent titles from previous columns
    const columnsWithTitles = results.map((col, index) => {
      if (index === 0 || col.parentId === null) {
        return col
      }
      const prevColumn = results[index - 1]
      const parentItem = prevColumn?.items.find((item) => item.id === col.parentId)
      return {
        ...col,
        parentTitle: parentItem?.title || String(col.parentId),
      }
    })

    setColumns(columnsWithTitles)
  })

  // Load columns on mount - wait for path loading to complete
  useEffect(() => {
    if (isLoadingPath || hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true
    void loadColumns(initialExpandedPath)
  }, [initialExpandedPath, isLoadingPath])

  // Auto-scroll to the last column when columns change
  useEffect(() => {
    if (lastColumnRef.current && columns.length > 1) {
      lastColumnRef.current.scrollIntoView({ behavior: 'smooth', inline: 'start' })
    }
  }, [columns.length])

  const handleExpand = useCallback(
    async ({ columnIndex, itemId }: { columnIndex: number; itemId: number | string }) => {
      const column = columns[columnIndex]
      if (!column) {
        return
      }

      const item = column.items.find((i) => i.id === itemId)
      if (!item) {
        return
      }

      // Update expanded path - keep path up to this column, add new item
      const newExpandedPath = [...expandedPath.slice(0, columnIndex), itemId]
      setExpandedPath(newExpandedPath)

      // Remove columns to the right and add new loading column
      const newColumns = columns.slice(0, columnIndex + 1)
      newColumns.push({
        hasNextPage: false,
        isLoading: true,
        items: [],
        page: 1,
        parentId: itemId,
        parentTitle: item.title,
        totalDocs: 0,
      })

      setColumns(newColumns)

      // Fetch children
      try {
        const { hasNextPage, items, totalDocs } = await fetchItems({ page: 1, parentId: itemId })

        setColumns((prev) => {
          const updated = [...prev]
          const targetIndex = columnIndex + 1

          if (updated[targetIndex]?.parentId === itemId) {
            updated[targetIndex] = {
              hasNextPage,
              isLoading: false,
              items,
              page: 1,
              parentId: itemId,
              parentTitle: item.title,
              totalDocs,
            }
          }

          return updated
        })
      } catch {
        setColumns((prev) => {
          const updated = [...prev]
          const targetIndex = columnIndex + 1

          if (updated[targetIndex]?.parentId === itemId) {
            updated[targetIndex] = {
              hasNextPage: false,
              isLoading: false,
              items: [],
              page: 1,
              parentId: itemId,
              parentTitle: item.title,
              totalDocs: 0,
            }
          }

          return updated
        })
      }
    },
    [columns, expandedPath, fetchItems],
  )

  const handleLoadMore = useCallback(
    async ({ columnIndex }: { columnIndex: number }) => {
      const column = columns[columnIndex]
      if (!column || column.isLoading || !column.hasNextPage) {
        return
      }

      const nextPage = column.page + 1

      // Set loading state
      setColumns((prev) => {
        const updated = [...prev]
        updated[columnIndex] = { ...updated[columnIndex], isLoading: true }
        return updated
      })

      try {
        const { hasNextPage, items: newItems } = await fetchItems({
          page: nextPage,
          parentId: column.parentId,
        })

        setColumns((prev) => {
          const updated = [...prev]

          if (updated[columnIndex]) {
            updated[columnIndex] = {
              ...updated[columnIndex],
              hasNextPage,
              isLoading: false,
              items: [...updated[columnIndex].items, ...newItems],
              page: nextPage,
            }
          }

          return updated
        })
      } catch {
        setColumns((prev) => {
          const updated = [...prev]

          if (updated[columnIndex]) {
            updated[columnIndex] = { ...updated[columnIndex], isLoading: false }
          }

          return updated
        })
      }
    },
    [columns, fetchItems],
  )

  // Build path for each column based on parent info
  const getPathToColumn = (columnIndex: number) => {
    const path: Array<{ id: number | string; title: string }> = []

    for (let i = 1; i <= columnIndex; i++) {
      const col = columns[i]
      if (col?.parentId !== null && col?.parentId !== undefined) {
        path.push({
          id: col.parentId,
          title: col.parentTitle || String(col.parentId),
        })
      }
    }

    return path
  }

  return (
    <div className={baseClass} ref={containerRef}>
      {columns.map((column, index) => {
        const isLastColumn = index === columns.length - 1 && !isLoadingPath
        const expandedId = expandedPath[index] ?? null
        const pathToColumn = getPathToColumn(index)

        return (
          <div
            className={`${baseClass}__column-wrapper`}
            key={`${column.parentId ?? 'root'}-${index}`}
            ref={isLastColumn ? lastColumnRef : undefined}
          >
            <Column
              ancestorsWithSelections={ancestorsWithSelections}
              canCreate={canCreate && Boolean(onCreateNew)}
              collectionLabel={collectionLabel}
              disabled={isLoadingPath}
              disabledIds={disabledIds}
              expandedId={expandedId}
              filterByCollection={filterByCollection}
              hasNextPage={column.hasNextPage}
              isLoading={column.isLoading}
              items={column.items}
              onCreateNew={onCreateNew || (() => {})}
              onExpand={({ id }) => handleExpand({ columnIndex: index, itemId: id })}
              onLoadMore={() => handleLoadMore({ columnIndex: index })}
              onSelect={onSelect}
              parentId={column.parentId}
              parentTitle={column.parentTitle}
              pathToColumn={pathToColumn}
              selectedIds={selectedIds}
              totalDocs={column.totalDocs}
            />
          </div>
        )
      })}
      {isLoadingPath && (
        <div className={`${baseClass}__column-wrapper ${baseClass}__column-wrapper--loading`}>
          <Spinner />
        </div>
      )}
    </div>
  )
}

export type {
  ColumnItemData,
  HierarchyColumnBrowserProps,
  HierarchyColumnBrowserRef,
  PathSegment,
} from './types.js'
