'use client'

import type { ClientCollectionConfig } from 'payload'

import { Table, useListQuery } from '@payloadcms/ui'
import React from 'react'

type RelationshipTableComponentProps = {
  readonly collectionConfig: ClientCollectionConfig
}

export const MyTableComponent: React.FC<RelationshipTableComponentProps> = ({
  collectionConfig,
}) => {
  const { data } = useListQuery()

  return (
    <Table
      customCellContext={{
        collectionSlug: collectionConfig.slug,
        uploadConfig: collectionConfig.upload,
      }}
      data={data.docs}
      fields={collectionConfig.fields}
    />
  )
}
