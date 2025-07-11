'use client'
import type { ClientCollectionConfig, PaginatedDocs } from 'payload'

import React, { useCallback } from 'react'

import type { IListQueryContext } from '../../providers/ListQuery/types.js'

import { useListQuery } from '../../providers/ListQuery/context.js'
import { PageControlsOnly } from './index.js'

/**
 * If `groupBy` is set in the query, multiple tables will render, one for each group.
 * In this case, each table needs its own `PageControls` to handle pagination.
 * These page controls, however, should not modify the global ListQuery state.
 * Instead, they should only handle the pagination for the current group.
 * To do this, build a wrapper around `PageControlsOnly` that handles the pagination logic for the current group.
 */
export const GroupByPageControls: React.FC<{
  AfterPageControls?: React.ReactNode
  collectionConfig: ClientCollectionConfig
  data: PaginatedDocs
}> = ({ AfterPageControls, collectionConfig, data }) => {
  const { query } = useListQuery()
  const { groupBy } = query

  const handlePageChange: IListQueryContext['handlePageChange'] = useCallback(async (page) => {
    console.log('Page changed to:', page)
  }, [])

  const handlePerPageChange: IListQueryContext['handlePerPageChange'] = useCallback(
    async (limit) => {
      console.log('Per page changed to:', limit)
    },
    [],
  )

  if (!groupBy) {
    return null
  }

  // TODO: control the actions with custom logic to modify the groupBy state instead of the global state
  return (
    <PageControlsOnly
      AfterPageControls={AfterPageControls}
      collectionConfig={collectionConfig}
      data={data}
      handlePageChange={handlePageChange}
      handlePerPageChange={handlePerPageChange}
    />
  )
}
