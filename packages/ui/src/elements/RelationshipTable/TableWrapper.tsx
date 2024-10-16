'use client'

import type { ClientCollectionConfig } from 'payload'

import React, { Fragment } from 'react'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { Pagination } from '../Pagination/index.js'
import { Table } from '../Table/index.js'

type RelationshipTableComponentProps = {
  readonly collectionConfig: ClientCollectionConfig
}

export const RelationshipTableWrapper: React.FC<RelationshipTableComponentProps> = (props) => {
  const { collectionConfig } = props

  const { data, handlePageChange } = useListQuery()

  return (
    <Fragment>
      <Table
        appearance="condensed"
        customCellContext={{
          collectionSlug: collectionConfig.slug,
          uploadConfig: collectionConfig.upload,
        }}
        data={data.docs}
        fields={collectionConfig.fields}
      />
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
    </Fragment>
  )
}
