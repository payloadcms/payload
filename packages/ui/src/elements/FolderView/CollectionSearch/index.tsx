'use client'

import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { SelectInput } from '../../../fields/Select/Input.js'
import { DraggableTableRow } from '../DraggableTableRow/index.js'
import { SimpleTable, TableHeader } from '../SimpleTable/index.js'

type CollectionSearchProps = {
  folderCollections: ClientCollectionConfig[]
}

export function CollectionSearch({ folderCollections }: CollectionSearchProps) {
  const [activeCollectionConfig, setActiveCollectionConfig] =
    React.useState<ClientCollectionConfig>(folderCollections[0])

  return (
    <div>
      <SelectInput
        name="collection"
        onChange={(option) => {
          if (!Array.isArray(option)) {
            const selectedCollection = folderCollections.find(
              (collection) => collection.slug === option.value,
            )
            if (selectedCollection) {
              setActiveCollectionConfig(selectedCollection)
            }
          }
        }}
        options={folderCollections.map((collection) => ({
          label: collection.labels.singular,
          value: collection.slug,
        }))}
        path="collection"
        value={activeCollectionConfig.slug}
      />
      <SimpleTable
        headerCells={[
          <TableHeader key={'name'}>Title</TableHeader>,
          <TableHeader key={'name2'}>Title2</TableHeader>,
        ]}
        tableRows={[
          <DraggableTableRow
            columns={['test', 'test2']}
            id={1}
            itemKey="item-1"
            key={'1'}
            onClick={() => {
              console.log('here')
            }}
          />,
          <DraggableTableRow
            columns={['test3', 'test4']}
            id={1}
            itemKey="item-2"
            key={'2'}
            onClick={() => {
              console.log('here')
            }}
          />,
        ]}
      />
    </div>
  )
}
