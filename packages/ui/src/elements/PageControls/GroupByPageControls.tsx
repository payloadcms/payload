'use client'
import type { PaginatedDocs } from 'payload'

import React, { useCallback } from 'react'

import { useListQuery } from '../../providers/ListQuery/context.js'
import { SimplePagination } from '../Pagination/SimplePagination/index.js'

/**
 * Simplified pagination for group-by tables.
 * Shows "X-Y of Z" with prev/next arrows. No page input or per-page selector.
 */
export const GroupByPageControls: React.FC<{
  data: PaginatedDocs
  groupByValue?: number | string
}> = ({ data, groupByValue }) => {
  const { refineListData } = useListQuery()

  const handlePageChange = useCallback(
    async (page: number) => {
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

  return <SimplePagination data={data} onChange={handlePageChange} />
}
