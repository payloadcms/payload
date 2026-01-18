'use client'
import type { ClientCollectionConfig, PaginatedDocs } from '@ruya.sa/payload'

import React, { useCallback } from 'react'

import type { IListQueryContext } from '../../providers/ListQuery/types.js'

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
  const { refineListData } = useListQuery()

  const handlePageChange: IListQueryContext['handlePageChange'] = useCallback(
    async (page) => {
      await refineListData({
        queryByGroup: {
          [groupByValue]: {
            page,
          },
        },
      })
    },
    [refineListData, groupByValue],
  )

  const handlePerPageChange: IListQueryContext['handlePerPageChange'] = useCallback(
    async (limit) => {
      await refineListData({
        queryByGroup: {
          [groupByValue]: {
            limit,
            page: 1,
          },
        },
      })
    },
    [refineListData, groupByValue],
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
