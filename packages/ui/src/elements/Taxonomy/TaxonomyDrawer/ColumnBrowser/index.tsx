'use client'
import { DEFAULT_TAXONOMY_TREE_LIMIT } from 'payload'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { ColumnBrowserProps, ColumnItemData, ColumnState } from '../types.js'

import { useConfig } from '../../../../providers/Config/index.js'
import { Column } from '../Column/index.js'
import './index.scss'

const baseClass = 'taxonomy-drawer-column-browser'

export const ColumnBrowser: React.FC<ColumnBrowserProps> = ({
  ancestorsWithSelections,
  onSelect,
  parentFieldName,
  selectedIds,
  taxonomySlug,
  useAsTitle = 'id',
}) => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: taxonomySlug })
  const treeLimit = collectionConfig?.taxonomy?.treeLimit ?? DEFAULT_TAXONOMY_TREE_LIMIT

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
        path: `/${taxonomySlug}${queryString}`,
        serverURL,
      })

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch taxonomy items')
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
    [api, parentFieldName, serverURL, taxonomySlug, treeLimit, useAsTitle],
  )

  // Fetch root items on mount
  useEffect(() => {
    const loadRootColumn = async () => {
      setColumns([
        {
          hasNextPage: false,
          isLoading: true,
          items: [],
          page: 1,
          parentId: null,
          totalDocs: 0,
        },
      ])

      try {
        const { hasNextPage, items, totalDocs } = await fetchItems(null, 1)

        setColumns([
          {
            hasNextPage,
            isLoading: false,
            items,
            page: 1,
            parentId: null,
            totalDocs,
          },
        ])
      } catch {
        setColumns([
          {
            hasNextPage: false,
            isLoading: false,
            items: [],
            page: 1,
            parentId: null,
            totalDocs: 0,
          },
        ])
      }
    }

    void loadRootColumn()
  }, [fetchItems])

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

  return (
    <div className={baseClass} ref={containerRef}>
      {columns.map((column, index) => {
        const isLastColumn = index === columns.length - 1
        const expandedId = expandedPath[index] ?? null

        return (
          <div
            className={`${baseClass}__column-wrapper`}
            key={`${column.parentId ?? 'root'}-${index}`}
            ref={isLastColumn ? lastColumnRef : undefined}
          >
            <Column
              ancestorsWithSelections={ancestorsWithSelections}
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
              selectedIds={selectedIds}
              taxonomySlug={taxonomySlug}
              totalDocs={column.totalDocs}
              useAsTitle={useAsTitle}
            />
          </div>
        )
      })}
    </div>
  )
}
