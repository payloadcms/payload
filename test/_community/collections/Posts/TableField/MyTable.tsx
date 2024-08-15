'use client'

import type { ClientCollectionConfig } from 'payload'

import { Pagination, Table, useListQuery } from '@payloadcms/ui'
import React, { Fragment } from 'react'

type RelationshipTableComponentProps = {
  readonly collectionConfig: ClientCollectionConfig
}

export const MyTableComponent: React.FC<RelationshipTableComponentProps> = ({
  collectionConfig,
}) => {
  const { data, handlePageChange } = useListQuery()

  return (
    <Fragment>
      <Table
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
        nextPage={data.nextPage || undefined}
        numberOfNeighbors={1}
        onChange={() => handlePageChange}
        page={data.page}
        prevPage={data.prevPage || undefined}
        totalPages={data.totalPages}
      />
    </Fragment>
  )
}
