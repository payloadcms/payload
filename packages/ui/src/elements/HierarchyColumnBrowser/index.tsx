'use client'
import { DEFAULT_HIERARCHY_TREE_LIMIT } from 'payload'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { ColumnItemData, ColumnState, HierarchyColumnBrowserProps } from './types.js'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useConfig } from '../../providers/Config/index.js'
import { Column } from './Column/index.js'
import './index.scss'

const baseClass = 'hierarchy-column-browser'

export const HierarchyColumnBrowser: React.FC<HierarchyColumnBrowserProps> = ({
  ancestorsWithSelections,
  collectionSlug,
  initialExpandedPath,
  onSelect,
  parentFieldName,
  selectedIds,
  useAsTitle = 'id',
}) => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const treeLimit = hierarchyConfig?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT

  const [columns, setColumns] = useState<ColumnState[]>([])
  const [expandedPath, setExpandedPath] = useState<(number | string)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const lastColumnRef = useRef<HTMLDivElement>(null)

  const fetchItems = useCallback(
    async (
      parentId: null | number | string,
      page: number,
    ): Promise<{
      hasNextPage: boolean
      items: ColumnItemData[]
      totalDocs: number
    }> => {
      const where =
        parentId === null
          ? {
              or: [
                { [parentFieldName]: { exists: false } },
                { [parentFieldName]: { equals: null } },
              ],
            }
          : { [parentFieldName]: { equals: parentId } }

      const queryString = qs.stringify(
        { limit: treeLimit, page, sort: useAsTitle, where },
        { addQueryPrefix: true },
      )

      const url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${queryString}`,
        serverURL,
      })

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }

      const data = await response.json()

      const items: ColumnItemData[] = (data.docs || []).map(
        (doc: { id: number | string } & Record<string, unknown>) => ({
          id: doc.id,
          hasChildren: true, // Always allow expansion - empty children handled gracefully
          title: String(doc[useAsTitle] || doc.id),
        }),
      )

      return {
        hasNextPage: data.hasNextPage || false,
        items,
        totalDocs: data.totalDocs || 0,
      }
    },
    [api, parentFieldName, serverURL, collectionSlug, treeLimit, useAsTitle],
  )

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
          const { hasNextPage, items, totalDocs } = await fetchItems(parentId, 1)
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

  // Load columns on mount
  useEffect(() => {
    void loadColumns(initialExpandedPath)
  }, [initialExpandedPath])

  // Auto-scroll to the last column when columns change
  useEffect(() => {
    if (lastColumnRef.current && columns.length > 1) {
      lastColumnRef.current.scrollIntoView({ behavior: 'smooth', inline: 'start' })
    }
  }, [columns.length])

  const handleExpand = useCallback(
    async (itemId: number | string, columnIndex: number) => {
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
        const { hasNextPage, items, totalDocs } = await fetchItems(itemId, 1)

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
    async (columnIndex: number) => {
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
        const { hasNextPage, items: newItems } = await fetchItems(column.parentId, nextPage)

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

  const handleDocumentCreated = useCallback((columnIndex: number, newItem: ColumnItemData) => {
    setColumns((prev) => {
      const updated = [...prev]

      if (updated[columnIndex]) {
        updated[columnIndex] = {
          ...updated[columnIndex],
          items: [newItem, ...updated[columnIndex].items],
        }
      }

      return updated
    })
  }, [])

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
        const isLastColumn = index === columns.length - 1
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
              collectionSlug={collectionSlug}
              expandedId={expandedId}
              hasNextPage={column.hasNextPage}
              isLoading={column.isLoading}
              items={column.items}
              onDocumentCreated={(newItem) => handleDocumentCreated(index, newItem)}
              onExpand={(id) => handleExpand(id, index)}
              onLoadMore={() => handleLoadMore(index)}
              onSelect={onSelect}
              parentFieldName={parentFieldName}
              parentId={column.parentId}
              parentTitle={column.parentTitle}
              pathToColumn={pathToColumn}
              selectedIds={selectedIds}
              totalDocs={column.totalDocs}
              useAsTitle={useAsTitle}
            />
          </div>
        )
      })}
    </div>
  )
}

export type { ColumnItemData, HierarchyColumnBrowserProps, PathSegment } from './types.js'
