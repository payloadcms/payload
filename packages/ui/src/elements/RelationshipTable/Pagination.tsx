'use client'

import React from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { Pagination } from '../Pagination/index.js'

export const RelationshipTablePagination: React.FC = () => {
  const { data, handlePageChange } = useListQuery()

  return (
    <Pagination
      hasNextPage={data.hasNextPage}
      hasPrevPage={data.hasPrevPage}
      limit={data.limit}
      nextPage={data.nextPage || 2}
      numberOfNeighbors={1}
      onChange={(e) => {
        void handlePageChange(e)
      }}
      page={data.page || 1}
      prevPage={data.prevPage || undefined}
      totalPages={data.totalPages}
    />
  )
}
