'use client'

import React from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { Pagination } from '../Pagination/index.js'

export const RelationshipTablePagination: React.FC = () => {
  const { data, handlePageChange } = useListQuery()

  if (!data?.totalDocs || !data?.limit) {
    return null
  }

  return (
    <Pagination
      hasNextPage={data.hasNextPage}
      hasPrevPage={data.hasPrevPage}
      limit={data.limit}
      nextPage={data.nextPage}
      numberOfNeighbors={1}
      onChange={handlePageChange}
      page={data.page}
      prevPage={data.prevPage}
      totalPages={data.totalPages}
    />
  )
}
