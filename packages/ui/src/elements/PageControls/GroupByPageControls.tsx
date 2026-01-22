'use client'
import type { ClientCollectionConfig, PaginatedDocs } from 'payload'

import React, { useCallback } from 'react'

import { useListQuery } from '../../providers/ListQuery/context.js'
import { PageControlsComponent } from './index.js'

/**
 * If `groupBy` is set in the query, multiple tables will render, one for each group.
 * In this case, each table needs its own `PageControls` to handle pagination.
 * These page controls, however, should not modify the global `ListQuery` state.
 * Instead, they should only handle the pagination for the current group.
 * To do this, build a wrapper around `PageControlsComponent` that handles the pagination logic for the current group.
 */
export const GroupByPageControls: React.FC<{
  AfterPageControls?: React.ReactNode
  collectionConfig: ClientCollectionConfig
  data: PaginatedDocs
  groupByValue?: number | string
}> = ({ AfterPageControls, collectionConfig, data, groupByValue }) => {
  const { setQuery } = useListQuery()

  const handlePageChange = useCallback(
    (page: number) => {
      setQuery({
        queryByGroup: {
          [groupByValue]: {
            page,
          },
        },
      })
    },
    [setQuery, groupByValue],
  )

  const handlePerPageChange = useCallback(
    (limit: number) => {
      setQuery({
        queryByGroup: {
          [groupByValue]: {
            limit,
            page: 1,
          },
        },
      })
    },
    [setQuery, groupByValue],
  )

  return (
    <PageControlsComponent
      AfterPageControls={AfterPageControls}
      collectionConfig={collectionConfig}
      data={data}
      handlePageChange={handlePageChange}
      handlePerPageChange={handlePerPageChange}
    />
  )
}
