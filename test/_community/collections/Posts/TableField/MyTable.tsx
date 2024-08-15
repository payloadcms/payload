'use client'

import type { ClientCollectionConfig } from 'payload'

import { Table, useListQuery } from '@payloadcms/ui'
import React from 'react'

type RelationshipTableComponentProps = {
  readonly collectionConfig: ClientCollectionConfig
  readonly field: {
    relationTo: string
  }
}

export const MyTableComponent: React.FC<RelationshipTableComponentProps> = ({
  collectionConfig,
  field: { relationTo },
}) => {
  const { data } = useListQuery()

  return (
    <Table
      customCellContext={{
        collectionSlug: relationTo,
        uploadConfig: collectionConfig.upload,
      }}
      data={data.docs}
      fields={collectionConfig.fields}
    />
  )
}
